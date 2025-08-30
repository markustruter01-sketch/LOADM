import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Scale, Package, AlertTriangle, Download, Mail, FileText } from "lucide-react";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useLocation, useRoute } from "wouter";
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  calculateBalance, 
  AIRCRAFT_CONFIGS, 
  type CargoPosition, 
  type BalanceResult,
  type AircraftConfig
} from "@/utils/simple-balance";

export default function LoadPlanningPage() {
  const [, navigate] = useLocation();
  const [match, params] = useRoute("/load-planning/:aircraftId");
  
  const aircraftId = params?.aircraftId || 'c130';
  const config = AIRCRAFT_CONFIGS[aircraftId];
  
  if (!config) {
    navigate("/load-planning");
    return null;
  }

  // KC30A cargo type selector state
  const [kc30aCargoType, setKc30aCargoType] = useState<'LD3' | 'Pallets' | 'GalleyCarts'>('LD3');

  // Initialize cargo positions for the aircraft
  const getCargoPositionsCount = () => {
    if (aircraftId === 'kc30a') {
      if (kc30aCargoType === 'LD3') return 26;
      if (kc30aCargoType === 'Pallets') return 8;
      if (kc30aCargoType === 'GalleyCarts') return 16; // A330 galley cart configuration
    }
    return config.positions;
  };

  const [cargoPositions, setCargoPositions] = useState<CargoPosition[]>(() => 
    Array.from({ length: getCargoPositionsCount() }, (_, i) => ({
      id: `P${i + 1}`,
      label: `P${i + 1}`,
      weight: 0,
      position: i,
      cargoType: 'General',
      dgClass: '',
      description: ''
    }))
  );

  // Update cargo positions when KC30A cargo type changes
  useEffect(() => {
    if (aircraftId === 'kc30a') {
      let newPositionCount = 26; // Default LD3
      if (kc30aCargoType === 'Pallets') newPositionCount = 8;
      if (kc30aCargoType === 'GalleyCarts') newPositionCount = 16;
      
      setCargoPositions(
        Array.from({ length: newPositionCount }, (_, i) => ({
          id: `P${i + 1}`,
          label: `P${i + 1}`,
          weight: 0,
          position: i,
          cargoType: 'General',
          dgClass: '',
          description: ''
        }))
      );
    }
  }, [kc30aCargoType, aircraftId]);

  const [balanceResult, setBalanceResult] = useState<BalanceResult>({
    balance: 0,
    centerOfGravity: (config.forwardLimit + config.aftLimit) / 2,
    status: 'safe',
    totalWeight: 0
  });



  // Cargo edit dialog state
  const [editingPosition, setEditingPosition] = useState<string | null>(null);

  // PDF export state
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [emailAddress, setEmailAddress] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [emailSending, setEmailSending] = useState(false);
  const [editWeight, setEditWeight] = useState(0);
  const [editCargoType, setEditCargoType] = useState('General');
  const [editDgClass, setEditDgClass] = useState('');
  const [editDescription, setEditDescription] = useState('');

  // Weight warning dialog state
  const [showWeightWarning, setShowWeightWarning] = useState(false);
  const [weightWarningMessage, setWeightWarningMessage] = useState('');

  // Recalculate balance whenever cargo changes
  useEffect(() => {
    const result = calculateBalance(cargoPositions, aircraftId, kc30aCargoType);
    setBalanceResult(result);
  }, [cargoPositions, aircraftId, kc30aCargoType]);



  // PDF Export Functions
  const generateLoadPlanPDF = async (shouldEmail: boolean = false) => {
    setIsExporting(true);
    
    try {
      // Find the cargo bay layout element
      const cargoBayElement = document.querySelector('[data-cargo-bay]') as HTMLElement;
      if (!cargoBayElement) {
        console.error('Cargo bay element not found');
        alert('Cargo bay layout not found. Please make sure the layout is visible.');
        setIsExporting(false);
        return;
      }

      console.log('Found cargo bay element:', cargoBayElement);

      // Create PDF with horizontal orientation first
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      // Calculate dimensions for horizontal layout
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      // Add header with CG information
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${config.name} Load Plan`, 20, 20);
      
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Center of Gravity: ${balanceResult.centerOfGravity.toFixed(1)}%`, 20, 30);
      pdf.text(`Total Weight: ${balanceResult.totalWeight.toLocaleString()} ${aircraftId === 'kc30a' ? 'kg' : 'lbs'}`, 20, 40);
      pdf.text(`Status: ${balanceResult.status.toUpperCase()}`, 20, 50);
      pdf.text(`Generated: ${new Date().toLocaleString()}`, 20, 60);

      // Add cargo positions summary instead of screenshot to avoid CORS issues
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Cargo Positions:', 20, 80);
      
      let yPos = 90;
      pdf.setFont('helvetica', 'normal');
      let hasCargoItems = false;
      
      cargoPositions.forEach((position, index) => {
        if (position.weight > 0) {
          hasCargoItems = true;
          const text = `Position ${position.id}: ${position.cargoType} - ${position.weight} ${aircraftId === 'kc30a' ? 'kg' : 'lbs'}`;
          pdf.text(text, 25, yPos);
          yPos += 8;
        }
      });
      
      if (!hasCargoItems) {
        pdf.text('No cargo loaded', 25, yPos);
        yPos += 8;
      }

      // For email sending, skip screenshot to reduce payload size
      if (!shouldEmail) {
        // Only capture screenshot for downloads to avoid large email payloads
        try {
          const canvas = await html2canvas(cargoBayElement, {
            backgroundColor: '#1f2937',
            scale: 0.5, // Reduce scale to decrease file size
            useCORS: false,
            allowTaint: true,
            logging: false,
            foreignObjectRendering: false,
            width: Math.min(cargoBayElement.scrollWidth, 800), // Limit width
            height: Math.min(cargoBayElement.scrollHeight, 600) // Limit height
          });

          const imgData = canvas.toDataURL('image/jpeg', 0.7); // Use JPEG with compression
          const imgWidth = pageWidth - 40;
          const imgHeight = (canvas.height * imgWidth) / canvas.width;
          
          const yPosition = yPos + 10;
          const maxHeight = pageHeight - yPosition - 20;
          const finalHeight = Math.min(imgHeight, maxHeight);
          const finalWidth = finalHeight === maxHeight ? (canvas.width * maxHeight) / canvas.height : imgWidth;
          
          if (finalHeight > 0 && finalWidth > 0) {
            pdf.addImage(imgData, 'JPEG', 20, yPosition, finalWidth, finalHeight);
          }
        } catch (screenshotError) {
          console.warn('Visual layout capture failed, using text summary only:', screenshotError);
        }
      } else {
        // For email, create a professional vector-based cargo bay diagram
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Cargo Bay Layout Diagram:', 20, yPos + 20);
        
        const startY = yPos + 35;
        const bayWidth = 200;
        const bayHeight = 80;
        const startX = 30;
        
        // Draw cargo bay outline
        pdf.setDrawColor(0, 0, 0);
        pdf.setLineWidth(0.5);
        pdf.rect(startX, startY, bayWidth, bayHeight);
        
        // Draw nose section
        pdf.setFillColor(240, 240, 240);
        pdf.rect(startX, startY, 40, bayHeight, 'F');
        pdf.setFontSize(10);
        pdf.text('NOSE', startX + 12, startY + bayHeight/2 + 2);
        
        // Draw position grid
        const numPositions = Math.max(cargoPositions.length, 8);
        const positionWidth = (bayWidth - 40) / numPositions;
        
        // Draw vertical separators
        for (let i = 1; i < numPositions; i++) {
          const x = startX + 40 + (i * positionWidth);
          pdf.setDrawColor(200, 200, 200);
          pdf.line(x, startY, x, startY + bayHeight);
        }
        
        // Fill cargo positions
        cargoPositions.forEach((position, index) => {
          const posX = startX + 40 + (index * positionWidth);
          
          if (position.weight > 0) {
            // Fill with cargo color based on type
            if (position.cargoType === 'DG') {
              pdf.setFillColor(255, 200, 200); // Light red for dangerous goods
            } else if (position.cargoType === 'PAX') {
              pdf.setFillColor(200, 255, 200); // Light green for passengers
            } else {
              pdf.setFillColor(200, 220, 255); // Light blue for general cargo
            }
            pdf.rect(posX + 1, startY + 1, positionWidth - 2, bayHeight - 2, 'F');
            
            // Add cargo info
            pdf.setFontSize(8);
            pdf.setTextColor(0, 0, 0);
            pdf.text(`P${position.id}`, posX + 3, startY + 12);
            pdf.text(position.cargoType, posX + 3, startY + 20);
            pdf.text(`${position.weight}${aircraftId === 'kc30a' ? 'kg' : 'lbs'}`, posX + 3, startY + 28);
          } else {
            // Empty position
            pdf.setFillColor(250, 250, 250);
            pdf.rect(posX + 1, startY + 1, positionWidth - 2, bayHeight - 2, 'F');
            pdf.setFontSize(8);
            pdf.setTextColor(150, 150, 150);
            pdf.text(`P${position.id}`, posX + 3, startY + 12);
            pdf.text('EMPTY', posX + 3, startY + 20);
          }
        });
        
        // Add center of gravity indicator
        const cgPosition = (balanceResult.centerOfGravity / 100) * bayWidth;
        pdf.setDrawColor(255, 0, 0);
        pdf.setLineWidth(2);
        pdf.line(startX + cgPosition, startY - 5, startX + cgPosition, startY + bayHeight + 5);
        
        pdf.setFontSize(8);
        pdf.setTextColor(255, 0, 0);
        pdf.text(`CG: ${balanceResult.centerOfGravity.toFixed(1)}%`, startX + cgPosition - 15, startY - 8);
        
        // Add legend
        pdf.setFontSize(10);
        pdf.setTextColor(0, 0, 0);
        pdf.text('Legend:', startX, startY + bayHeight + 20);
        
        // Legend items
        const legendY = startY + bayHeight + 30;
        pdf.setFillColor(255, 200, 200);
        pdf.rect(startX, legendY, 10, 8, 'F');
        pdf.text('Dangerous Goods', startX + 15, legendY + 6);
        
        pdf.setFillColor(200, 255, 200);
        pdf.rect(startX + 80, legendY, 10, 8, 'F');
        pdf.text('Passengers', startX + 95, legendY + 6);
        
        pdf.setFillColor(200, 220, 255);
        pdf.rect(startX + 150, legendY, 10, 8, 'F');
        pdf.text('General Cargo', startX + 165, legendY + 6);
      }

      const fileName = `${config.name}_LoadPlan_${new Date().toISOString().split('T')[0]}.pdf`;

      if (shouldEmail && emailAddress) {
        try {
          setEmailSending(true);
          
          // Convert PDF to base64 for email
          const pdfBase64 = pdf.output('datauristring').split(',')[1];
          
          // Log payload size for debugging
          const payloadSize = Math.round(pdfBase64.length / 1024);
          console.log(`PDF payload size: ${payloadSize}KB`);
          
          if (payloadSize > 10000) { // 10MB threshold
            console.warn('PDF payload very large, may cause timeout');
          }
          
          // Create abort controller with longer timeout for large files
          const controller = new AbortController();
          const timeoutId = setTimeout(() => {
            controller.abort();
          }, 30000); // 30 second timeout for email
          
          // Send email with PDF attachment
          const response = await fetch('/api/send-load-plan-email', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: emailAddress,
              fileName,
              pdfData: pdfBase64,
              aircraftName: config.name,
              centerOfGravity: balanceResult.centerOfGravity.toFixed(1),
              totalWeight: balanceResult.totalWeight.toLocaleString(),
              status: balanceResult.status
            }),
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          if (response.ok) {
            const result = await response.json();
            alert('Load plan PDF sent successfully!');
            setShowEmailDialog(false);
            setEmailAddress('');
          } else {
            const errorData = await response.text();
            console.error('Email sending failed:', response.status, errorData);
            
            // Fall back to download
            pdf.save(fileName);
            alert(`Email failed (${response.status}) - PDF downloaded instead. Please try again or contact support.`);
            setShowEmailDialog(false);
          }
        } catch (emailError: any) {
          console.error('Email request failed:', emailError);
          
          // Fall back to download
          pdf.save(fileName);
          if (emailError?.name === 'AbortError') {
            alert('Email timeout - PDF downloaded instead. The file may be too large for email.');
          } else if (emailError?.message?.includes('Failed to fetch')) {
            alert('Network error - PDF downloaded instead. Please check your connection.');
          } else {
            alert('Email service unavailable - PDF downloaded instead.');
          }
          setShowEmailDialog(false);
        } finally {
          setEmailSending(false);
        }
      } else {
        // Download PDF
        pdf.save(fileName);
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadPDF = () => {
    generateLoadPlanPDF(false);
  };

  const handleEmailPDF = () => {
    setShowEmailDialog(true);
  };

  const handleSendEmail = () => {
    if (!emailAddress.trim()) {
      alert('Please enter an email address');
      return;
    }
    generateLoadPlanPDF(true);
  };

  const updateCargoWeight = (positionId: string, weight: number) => {
    // Get weight limits based on aircraft and cargo type
    const getWeightLimits = () => {
      if (aircraftId === 'kc30a' && kc30aCargoType === 'LD3') {
        return {
          tareWeight: 110, // kg for LD3
          maxTotalWeight: 1588, // kg for LD3
          unit: 'kg'
        };
      } else if (aircraftId === 'kc30a' && kc30aCargoType === 'Pallets') {
        return {
          tareWeight: 132, // kg for KC30A pallets (290 lbs converted)
          maxTotalWeight: 4536, // kg for KC30A pallets (10,000 lbs converted)
          unit: 'kg'
        };
      } else {
        return {
          tareWeight: 290, // lbs for other aircraft pallets
          maxTotalWeight: 10000, // lbs for other aircraft pallets
          unit: 'lbs'
        };
      }
    };
    
    const limits = getWeightLimits();
    const maxCargoWeight = limits.maxTotalWeight - limits.tareWeight;
    
    if (weight > maxCargoWeight) {
      setWeightWarningMessage(`
        Total weight limit: ${limits.maxTotalWeight.toLocaleString()} ${limits.unit}
        Container tare weight: ${limits.tareWeight} ${limits.unit}
        Maximum cargo weight: ${maxCargoWeight.toLocaleString()} ${limits.unit}
        
        Please enter a value of ${maxCargoWeight.toLocaleString()} ${limits.unit} or less.
      `);
      setShowWeightWarning(true);
      return;
    }
    
    setCargoPositions(prev => 
      prev.map(pos => 
        pos.id === positionId 
          ? { ...pos, weight: Math.max(0, weight) }
          : pos
      )
    );
  };

  const openCargoEdit = (position: CargoPosition) => {
    setEditingPosition(position.id);
    setEditWeight(position.weight);
    setEditCargoType(position.cargoType);
    setEditDgClass(position.dgClass);
    setEditDescription(position.description);
  };

  const saveCargoEdit = () => {
    if (!editingPosition) return;
    
    // Get weight limits based on aircraft and cargo type
    const getWeightLimits = () => {
      if (aircraftId === 'kc30a' && kc30aCargoType === 'LD3') {
        return {
          tareWeight: 110, // kg for LD3
          maxTotalWeight: 1588, // kg for LD3
          unit: 'kg'
        };
      } else if (aircraftId === 'kc30a' && kc30aCargoType === 'Pallets') {
        return {
          tareWeight: 132, // kg for KC30A pallets (290 lbs converted)
          maxTotalWeight: 4536, // kg for KC30A pallets (10,000 lbs converted)
          unit: 'kg'
        };
      } else {
        return {
          tareWeight: 290, // lbs for other aircraft pallets
          maxTotalWeight: 10000, // lbs for other aircraft pallets
          unit: 'lbs'
        };
      }
    };
    
    const limits = getWeightLimits();
    const maxCargoWeight = limits.maxTotalWeight - limits.tareWeight;
    
    if (editWeight > maxCargoWeight) {
      setWeightWarningMessage(`
        Total weight limit: ${limits.maxTotalWeight.toLocaleString()} ${limits.unit}
        Container tare weight: ${limits.tareWeight} ${limits.unit}
        Maximum cargo weight: ${maxCargoWeight.toLocaleString()} ${limits.unit}
        
        Please enter a value of ${maxCargoWeight.toLocaleString()} ${limits.unit} or less.
      `);
      setShowWeightWarning(true);
      return;
    }
    
    setCargoPositions(prev => 
      prev.map(pos => 
        pos.id === editingPosition 
          ? { ...pos, weight: editWeight, cargoType: editCargoType, dgClass: editDgClass, description: editDescription }
          : pos
      )
    );
    
    setEditingPosition(null);
    setEditWeight(0);
    setEditCargoType('General');
    setEditDgClass('');
    setEditDescription('');
  };

  const resetAllCargo = () => {
    setCargoPositions(prev => 
      prev.map(pos => ({ 
        ...pos, 
        weight: 0, 
        cargoType: 'General', 
        dgClass: '', 
        description: '' 
      }))
    );
  };

  // Reusable cargo position component
  const renderCargoPosition = (position: CargoPosition, maxWeight = 15000) => (
    <div key={position.id} className="space-y-2">
      <div 
        className={`relative border-2 rounded-lg p-3 transition-all duration-300 cursor-pointer hover:border-primary ${
          position.weight > 0 
            ? 'border-orange-500 bg-orange-500/20' 
            : 'border-gray-600 bg-gray-700/30'
        }`}
        onClick={() => openCargoEdit(position)}
      >
        <Label className="text-muted-foreground300 font-bold text-center block mb-2 text-sm">
          {position.label}
        </Label>
        
        {/* Weight display */}
        <div className="text-center text-lg font-semibold text-card-foreground mb-1">
          {position.weight > 0 ? position.weight.toLocaleString() : '0'}
        </div>
        <div className="text-xs text-muted-foreground400 text-center">
          {aircraftId === 'kc30a' ? 'kg' : 'lbs'}
        </div>
        
        {/* Cargo type display */}
        {position.cargoType !== 'General' && (
          <div className="text-xs text-center mt-2">
            <Badge variant="secondary" className="text-xs px-1 py-0">
              {position.cargoType === 'DG' ? 'DG' : position.cargoType}
            </Badge>
          </div>
        )}
        
        {position.dgClass && (
          <div className="text-xs text-center mt-1">
            <Badge variant="destructive" className="text-xs px-1 py-0">
              Class {position.dgClass}
            </Badge>
          </div>
        )}
        
        {position.description && (
          <div className="text-xs text-center mt-1 text-muted-foreground truncate" title={position.description}>
            {position.description}
          </div>
        )}
        
        {/* Weight visualization */}
        {position.weight > 0 && (
          <div className="absolute inset-1 border border-orange-400 rounded-md opacity-30 pointer-events-none"></div>
        )}
        
        {/* Click indicator */}
        <div className="absolute top-1 right-1 text-xs text-muted-foreground opacity-50">
          ✏️
        </div>
      </div>
    </div>
  );

  const getStatusColor = (status: BalanceResult['status']) => {
    switch (status) {
      case 'safe': return 'bg-green-500';
      case 'caution': return 'bg-yellow-500';
      case 'warning': return 'bg-orange-500';
      case 'critical': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getBalanceBarPosition = () => {
    // Convert balance (-100 to +100) to percentage (0 to 100)
    return ((balanceResult.balance + 100) / 2);
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{config.name} Load Planning | LOADMworkflow</title>
        <meta name="description" content={`Load planning for ${config.name}`} />
      </Helmet>

      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="outline" 
            onClick={() => navigate("/load-planning")}
            className="border-gray-600 text-muted-foreground300 hover:bg-gray-700 hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-card-foreground">{config.name} Load Planning</h1>
            <p className="text-muted-foreground300">
              Max Payload: {aircraftId === 'kc30a' ? '34,000 kg' : `${config.maxWeight.toLocaleString()} lbs`} | 
              Max Positions: {aircraftId === 'kc30a' ? (kc30aCargoType === 'LD3' ? '26' : kc30aCargoType === 'Pallets' ? '8' : '16') : config.positions}
            </p>
          </div>
        </div>

        {/* Load Summary */}
        <Card className="bg-card mb-6">
          <CardHeader>
            <CardTitle className="text-card-foreground flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Load Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label className="text-muted-foreground400">Current Load</Label>
                <p className="text-2xl font-bold text-card-foreground">
                  {balanceResult.totalWeight.toLocaleString()} {aircraftId === 'kc30a' ? 'kg' : 'lbs'}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground400">Maximum Payload</Label>
                <p className="text-2xl font-bold text-muted-foreground300">
                  {aircraftId === 'kc30a' ? '34,000 kg' : `${config.maxWeight.toLocaleString()} lbs`}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground400">Positions Filled</Label>
                <p className="text-2xl font-bold text-blue-400">
                  {cargoPositions.filter(p => p.weight > 0).length} of {config.positions}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground400">Center of Gravity</Label>
                <p className="text-2xl font-bold text-green-400">{balanceResult.centerOfGravity.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Balance Display */}
        <Card className="bg-card mb-6">
          <CardHeader>
            <CardTitle className="text-card-foreground flex items-center gap-2">
              <Scale className="h-5 w-5 text-primary" />
              Balance Scale
              <Badge className={getStatusColor(balanceResult.status)}>
                {balanceResult.status.toUpperCase()}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Balance Status Alert */}
              {balanceResult.status !== 'safe' && (
                <Alert className="border-orange-500 bg-orange-500/10">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-orange-200">
                    Aircraft balance is {balanceResult.status}. 
                    {balanceResult.status === 'critical' && ' Immediate attention required!'}
                  </AlertDescription>
                </Alert>
              )}

              {/* Balance Bar */}
              <div className="relative">
                <div className="flex justify-between text-sm text-muted-foreground400 mb-2">
                  <span>Heavy Forward</span>
                  <span>Center</span>
                  <span>Heavy Aft</span>
                </div>
                <div className="relative h-8 bg-gray-700 rounded-lg overflow-hidden">
                  {/* Background gradient */}
                  <div className="absolute inset-0 bg-gray-700 opacity-30"></div>
                  
                  {/* Center line */}
                  <div className="absolute left-1/2 top-0 w-0.5 h-full bg-white/50 transform -trangray-x-0.5"></div>
                  
                  {/* Balance indicator */}
                  <div 
                    className="absolute top-1 bottom-1 w-2 bg-white rounded-sm transition-all duration-300"
                    style={{ left: `calc(${getBalanceBarPosition()}% - 4px)` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground500 mt-1">
                  <span>-100</span>
                  <span>0</span>
                  <span>+100</span>
                </div>
                <div className="text-center mt-2">
                  <span className="text-lg font-bold text-card-foreground">
                    Balance: {balanceResult.balance.toFixed(1)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>



        {/* Cargo Positions */}
        <Card className="bg-card mb-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-card-foreground">
              {aircraftId === 'kc30a' && kc30aCargoType === 'GalleyCarts' ? 'Galley Cart Layout' : 'Cargo Bay Layout'}
            </CardTitle>
            <div className="flex gap-2">

              <Button 
                variant="outline" 
                onClick={resetAllCargo}
                className="border-gray-600 text-muted-foreground300 hover:bg-gray-700"
              >
                Reset All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6" data-cargo-bay>
              {/* Aircraft Direction Indicator */}
              <div className="flex items-center justify-center gap-4 text-muted-foreground400 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-0 h-0 border-l-4 border-r-4 border-b-4 border-l-transparent border-r-transparent border-b-gray-400"></div>
                  <span>NOSE (Forward)</span>
                </div>
                <div className="flex-1 border-t border-dashed border-gray-600"></div>
                <span>TAIL (Aft)</span>
                <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-400"></div>
              </div>

              {/* C-130 Cargo Bay Layout (2 rows x 4 columns) */}
              {aircraftId === 'c130' && (
                <div className="bg-gray-900/50 rounded-lg p-6 border border-gray-600">
                  <div className="space-y-3">
                    {/* Upper Row (P1-P4) */}
                    <div className="grid grid-cols-4 gap-3">
                      {cargoPositions.slice(0, 4).map((position) => renderCargoPosition(position, 10000))}
                    </div>
                    
                    {/* Lower Row (P5-P8) */}
                    <div className="grid grid-cols-4 gap-3">
                      {cargoPositions.slice(4, 8).map((position) => renderCargoPosition(position, 10000))}
                    </div>
                  </div>
                  
                  {/* Cargo Bay Labels */}
                  <div className="flex justify-between text-xs text-muted-foreground500 mt-4">
                    <span>Forward Cargo Bay</span>
                    <span>Aft Cargo Bay</span>
                  </div>
                </div>
              )}

              {/* C-17 Cargo Bay Layout (2 rows x 9 columns) */}
              {aircraftId === 'c17' && (
                <div className="bg-gray-900/50 rounded-lg p-6 border border-gray-600">
                  <div className="space-y-3">
                    {/* Upper Row (P1-P9) */}
                    <div className="grid grid-cols-9 gap-2">
                      {cargoPositions.slice(0, 9).map((position) => renderCargoPosition(position, 15000))}
                    </div>
                    
                    {/* Lower Row (P10-P18) */}
                    <div className="grid grid-cols-9 gap-2">
                      {cargoPositions.slice(9, 18).map((position) => renderCargoPosition(position, 15000))}
                    </div>
                  </div>
                  
                  {/* Cargo Bay Labels */}
                  <div className="flex justify-between text-xs text-muted-foreground500 mt-4">
                    <span>Forward Cargo Bay</span>
                    <span>Aft Cargo Bay</span>
                  </div>
                </div>
              )}

              {/* KC30-A Cargo Bay Layout */}
              {aircraftId === 'kc30a' && (
                <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-600">
                  {/* KC30A Cargo Type Selector */}
                  <div className="mb-4">
                    <div className="flex items-center gap-3">
                      <Label className="text-sm font-medium text-card-foreground">Cargo Configuration:</Label>
                      <Select value={kc30aCargoType} onValueChange={(value: 'LD3' | 'Pallets' | 'GalleyCarts') => setKc30aCargoType(value)}>
                        <SelectTrigger className="w-40 bg-gray-800 border-gray-600">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-600">
                          <SelectItem value="LD3">LD3 Containers</SelectItem>
                          <SelectItem value="Pallets">463L Pallets</SelectItem>
                          <SelectItem value="GalleyCarts">Galley Carts</SelectItem>
                        </SelectContent>
                      </Select>
                      <div className="text-xs text-muted-foreground">
                        {kc30aCargoType === 'LD3' ? '26 positions (2×13)' : 
                         kc30aCargoType === 'Pallets' ? '8 positions (1×8)' : 
                         '16 positions (2×8)'}
                      </div>
                    </div>
                  </div>

                  {/* LD3 Configuration (2 rows x 13 columns) */}
                  {kc30aCargoType === 'LD3' && (
                    <div className="space-y-2">
                      {/* Upper Row (P1-P13) */}
                      <div className="grid grid-cols-13 gap-1">
                        {cargoPositions.slice(0, 13).map((position) => (
                          <div key={position.id} className="space-y-1">
                            <div 
                              className={`relative border-2 rounded-lg p-1 transition-all duration-300 cursor-pointer hover:border-primary ${
                                position.weight > 0 
                                  ? 'border-orange-500 bg-orange-500/20' 
                                  : 'border-gray-600 bg-gray-700/30'
                              }`}
                              onClick={() => openCargoEdit(position)}
                            >
                              <Label className="text-muted-foreground300 font-bold text-center block mb-1 text-xs">
                                {position.label}
                              </Label>
                              
                              {/* Weight display */}
                              <div className="text-center text-sm font-semibold text-card-foreground mb-1">
                                {position.weight > 0 ? position.weight.toLocaleString() : '0'}
                              </div>
                              <div className="text-xs text-muted-foreground400 text-center">kg</div>
                              
                              {/* Cargo type display */}
                              {position.cargoType !== 'General' && (
                                <div className="text-xs text-center mt-1">
                                  <Badge variant="secondary" className="text-xs px-1 py-0">
                                    {position.cargoType === 'DG' ? 'DG' : position.cargoType}
                                  </Badge>
                                </div>
                              )}
                              
                              {position.dgClass && (
                                <div className="text-xs text-center mt-1">
                                  <Badge variant="destructive" className="text-xs px-1 py-0">
                                    {position.dgClass}
                                  </Badge>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {/* Lower Row (P14-P26) */}
                      <div className="grid grid-cols-13 gap-1">
                        {cargoPositions.slice(13, 26).map((position) => (
                          <div key={position.id} className="space-y-1">
                            <div 
                              className={`relative border-2 rounded-lg p-1 transition-all duration-300 cursor-pointer hover:border-primary ${
                                position.weight > 0 
                                  ? 'border-orange-500 bg-orange-500/20' 
                                  : 'border-gray-600 bg-gray-700/30'
                              }`}
                              onClick={() => openCargoEdit(position)}
                            >
                              <Label className="text-muted-foreground300 font-bold text-center block mb-1 text-xs">
                                {position.label}
                              </Label>
                              
                              {/* Weight display */}
                              <div className="text-center text-sm font-semibold text-card-foreground mb-1">
                                {position.weight > 0 ? position.weight.toLocaleString() : '0'}
                              </div>
                              <div className="text-xs text-muted-foreground400 text-center">kg</div>
                              
                              {/* Cargo type display */}
                              {position.cargoType !== 'General' && (
                                <div className="text-xs text-center mt-1">
                                  <Badge variant="secondary" className="text-xs px-1 py-0">
                                    {position.cargoType === 'DG' ? 'DG' : position.cargoType}
                                  </Badge>
                                </div>
                              )}
                              
                              {position.dgClass && (
                                <div className="text-xs text-center mt-1">
                                  <Badge variant="destructive" className="text-xs px-1 py-0">
                                    {position.dgClass}
                                  </Badge>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Pallet Configuration (1 row x 8 columns) */}
                  {kc30aCargoType === 'Pallets' && (
                    <div className="grid grid-cols-8 gap-3">
                      {cargoPositions.map((position) => renderCargoPosition(position, 6800))}
                    </div>
                  )}

                  {/* Galley Cart Configuration (2 rows x 8 columns) - A330 Layout */}
                  {kc30aCargoType === 'GalleyCarts' && (
                    <div className="space-y-2">
                      {/* Upper Row (P1-P8) */}
                      <div className="grid grid-cols-8 gap-2">
                        {cargoPositions.slice(0, 8).map((position) => (
                          <div key={position.id} className="space-y-1">
                            <div 
                              className={`relative border-2 rounded-lg p-2 transition-all duration-300 cursor-pointer hover:border-primary ${
                                position.weight > 0 
                                  ? 'border-orange-500 bg-orange-500/20' 
                                  : 'border-gray-600 bg-gray-700/30'
                              }`}
                              onClick={() => openCargoEdit(position)}
                            >
                              <Label className="text-muted-foreground300 font-bold text-center block mb-1 text-xs">
                                {position.label}
                              </Label>
                              
                              {/* Weight display */}
                              <div className="text-center text-sm font-semibold text-card-foreground mb-1">
                                {position.weight > 0 ? position.weight.toLocaleString() : '0'}
                              </div>
                              <div className="text-xs text-muted-foreground400 text-center">kg</div>
                              
                              {/* Cargo type display */}
                              {position.cargoType !== 'General' && (
                                <div className="text-xs text-center mt-1">
                                  <Badge variant="secondary" className="text-xs px-1 py-0">
                                    {position.cargoType === 'DG' ? 'DG' : position.cargoType}
                                  </Badge>
                                </div>
                              )}
                              
                              {position.dgClass && (
                                <div className="text-xs text-center mt-1">
                                  <Badge variant="destructive" className="text-xs px-1 py-0">
                                    {position.dgClass}
                                  </Badge>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {/* Lower Row (P9-P16) */}
                      <div className="grid grid-cols-8 gap-2">
                        {cargoPositions.slice(8, 16).map((position) => (
                          <div key={position.id} className="space-y-1">
                            <div 
                              className={`relative border-2 rounded-lg p-2 transition-all duration-300 cursor-pointer hover:border-primary ${
                                position.weight > 0 
                                  ? 'border-orange-500 bg-orange-500/20' 
                                  : 'border-gray-600 bg-gray-700/30'
                              }`}
                              onClick={() => openCargoEdit(position)}
                            >
                              <Label className="text-muted-foreground300 font-bold text-center block mb-1 text-xs">
                                {position.label}
                              </Label>
                              
                              {/* Weight display */}
                              <div className="text-center text-sm font-semibold text-card-foreground mb-1">
                                {position.weight > 0 ? position.weight.toLocaleString() : '0'}
                              </div>
                              <div className="text-xs text-muted-foreground400 text-center">kg</div>
                              
                              {/* Cargo type display */}
                              {position.cargoType !== 'General' && (
                                <div className="text-xs text-center mt-1">
                                  <Badge variant="secondary" className="text-xs px-1 py-0">
                                    {position.cargoType === 'DG' ? 'DG' : position.cargoType}
                                  </Badge>
                                </div>
                              )}
                              
                              {position.dgClass && (
                                <div className="text-xs text-center mt-1">
                                  <Badge variant="destructive" className="text-xs px-1 py-0">
                                    {position.dgClass}
                                  </Badge>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Cargo Bay Labels */}
                  <div className="flex justify-between text-xs text-muted-foreground500 mt-3">
                    <span>Forward Cargo Bay</span>
                    <span>Aft Cargo Bay</span>
                  </div>
                </div>
              )}

              {/* C-27J Cargo Bay Layout (1 row x 3 columns) */}
              {aircraftId === 'c27j' && (
                <div className="bg-gray-900/50 rounded-lg p-6 border border-gray-600">
                  <div className="grid grid-cols-3 gap-3">
                    {cargoPositions.map((position) => renderCargoPosition(position, 8000))}
                  </div>
                  
                  {/* Cargo Bay Labels */}
                  <div className="flex justify-center text-xs text-muted-foreground500 mt-4">
                    <span>Main Cargo Bay</span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>





        <div className="mt-8 text-center">
          <Button 
            variant="outline" 
            onClick={() => navigate("/")}
            className="border-gray-600 text-muted-foreground300 hover:bg-gray-700"
          >
            Back to Dashboard
          </Button>
        </div>
      </div>

      {/* Cargo Edit Dialog */}
      <Dialog open={editingPosition !== null} onOpenChange={(open) => !open && setEditingPosition(null)}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Edit Cargo Details - {editingPosition}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="weight">
                Weight ({aircraftId === 'kc30a' ? 'kg' : 'lbs'})
              </Label>
              <Input
                type="number"
                min="0"
                max={aircraftId === 'kc30a' ? 
                  (kc30aCargoType === 'LD3' ? 1478 : kc30aCargoType === 'Pallets' ? 4404 : 200) : 
                  9710
                }
                value={editWeight}
                onChange={(e) => setEditWeight(parseInt(e.target.value) || 0)}
                placeholder={`Enter weight in ${aircraftId === 'kc30a' ? 'kilograms' : 'pounds'}...`}
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cargoType">Cargo Type</Label>
              <Select value={editCargoType} onValueChange={setEditCargoType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select cargo type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="General">General Cargo</SelectItem>
                  <SelectItem value="Mechanical">Mechanical Parts</SelectItem>
                  <SelectItem value="Perishable">Perishable Goods</SelectItem>
                  <SelectItem value="Passenger Bags">Passenger Bags</SelectItem>
                  <SelectItem value="Military Equipment">Military Equipment</SelectItem>
                  <SelectItem value="Medical Supplies">Medical Supplies</SelectItem>
                  <SelectItem value="Electronics">Electronics</SelectItem>
                  <SelectItem value="Ammunition">Ammunition</SelectItem>
                  <SelectItem value="Fuel/Oil">Fuel/Oil</SelectItem>
                  <SelectItem value="Vehicle">Vehicle</SelectItem>
                  <SelectItem value="DG">Dangerous Goods</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {editCargoType === 'DG' && (
              <div className="space-y-2">
                <Label htmlFor="dgClass">Dangerous Goods Class</Label>
                <Select value={editDgClass} onValueChange={setEditDgClass}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select DG class" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Class 1 - Explosives</SelectItem>
                    <SelectItem value="2">Class 2 - Gases</SelectItem>
                    <SelectItem value="3">Class 3 - Flammable Liquids</SelectItem>
                    <SelectItem value="4">Class 4 - Flammable Solids</SelectItem>
                    <SelectItem value="5">Class 5 - Oxidizers</SelectItem>
                    <SelectItem value="6">Class 6 - Toxic Substances</SelectItem>
                    <SelectItem value="7">Class 7 - Radioactive</SelectItem>
                    <SelectItem value="8">Class 8 - Corrosives</SelectItem>
                    <SelectItem value="9">Class 9 - Miscellaneous</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Input
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Enter cargo description..."
                className="bg-muted"
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setEditingPosition(null)}>
                Cancel
              </Button>
              <Button onClick={saveCargoEdit} className="bg-primary hover:bg-primary/90">
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Weight Warning Dialog */}
      <Dialog open={showWeightWarning} onOpenChange={setShowWeightWarning}>
        <DialogContent className="bg-gray-800 border-gray-600 max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-orange-400">
              <AlertTriangle className="h-5 w-5" />
              Weight Limit Exceeded
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Alert className="border-orange-500 bg-orange-500/10">
              <AlertTriangle className="h-4 w-4 text-orange-400" />
              <AlertDescription className="text-card-foreground">
                Maximum container weight limit has been reached.
              </AlertDescription>
            </Alert>
            
            <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-600">
              <div className="space-y-2 text-sm text-muted-foreground">
                {weightWarningMessage.split('\n').map((line, index) => (
                  line.trim() && (
                    <div key={index} className="flex justify-between">
                      <span>{line.split(':')[0]}:</span>
                      <span className="text-card-foreground font-medium">
                        {line.split(':')[1]?.trim()}
                      </span>
                    </div>
                  )
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <Button 
                onClick={() => setShowWeightWarning(false)}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                Understood
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Email PDF Dialog */}
      <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
        <DialogContent className="bg-gray-800 border-gray-600 max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-blue-400">
              <Mail className="h-5 w-5" />
              Email Load Plan PDF
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-card-foreground">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
                placeholder="Enter email address"
                className="bg-gray-700 border-gray-600 text-card-foreground mt-2"
              />
            </div>
            
            <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-600">
              <div className="text-sm text-muted-foreground space-y-1">
                <div className="flex justify-between">
                  <span>Aircraft:</span>
                  <span className="text-card-foreground">{config.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Center of Gravity:</span>
                  <span className="text-card-foreground">{balanceResult.centerOfGravity.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Weight:</span>
                  <span className="text-card-foreground">{balanceResult.totalWeight.toLocaleString()} {aircraftId === 'kc30a' ? 'kg' : 'lbs'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span className="text-card-foreground">{balanceResult.status.toUpperCase()}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button 
                variant="outline" 
                onClick={() => setShowEmailDialog(false)}
                disabled={isExporting}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSendEmail}
                disabled={isExporting || emailSending || !emailAddress.trim()}
                className="bg-blue-500 hover:bg-blue-600 text-white"
              >
                <Mail className="h-4 w-4 mr-2" />
                {emailSending ? 'Sending...' : isExporting ? 'Preparing...' : 'Send PDF'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}