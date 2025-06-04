import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Scale, Package, AlertTriangle, MessageCircle, Bot, Send, Download, Mail, FileText } from "lucide-react";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useLocation, useRoute } from "wouter";
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
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
  const [kc30aCargoType, setKc30aCargoType] = useState<'LD3' | 'Pallets'>('LD3');

  // Initialize cargo positions for the aircraft
  const getCargoPositionsCount = () => {
    if (aircraftId === 'kc30a') {
      return kc30aCargoType === 'LD3' ? 26 : 8;
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
      const newPositionCount = kc30aCargoType === 'LD3' ? 26 : 8;
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

  // Chatbot state
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<Array<{
    type: 'user' | 'bot';
    message: string;
    timestamp: Date;
  }>>([
    {
      type: 'bot',
      message: `Welcome to your ${config.name} Load Planning Assistant! I can help you optimize cargo placement and provide safety recommendations for dangerous goods positioning.`,
      timestamp: new Date()
    }
  ]);

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
    const result = calculateBalance(cargoPositions, aircraftId);
    setBalanceResult(result);
  }, [cargoPositions, aircraftId]);

  // AI Chatbot functions
  const generateAIResponse = (userMessage: string): string => {
    const message = userMessage.toLowerCase();
    const totalWeight = balanceResult.totalWeight;
    const balance = balanceResult.balance;
    const status = balanceResult.status;
    
    // Analyze current load state
    const loadedPositions = cargoPositions.filter(pos => pos.weight > 0);
    const hasHeavyItems = loadedPositions.some(pos => pos.weight > 10000);
    const hasDangerousGoods = message.includes('dg') || message.includes('dangerous') || message.includes('hazmat');
    const actualDangerousGoods = cargoPositions.some(pos => pos.cargoType === 'DG');
    
    // Check if DG is placed but not in aft positions
    if (actualDangerousGoods) {
      const dangerousPositions = cargoPositions.filter(pos => pos.cargoType === 'DG');
      const getAftPositions = () => {
        if (aircraftId === 'kc30a') {
          return kc30aCargoType === 'LD3' ? ['P21', 'P22', 'P23', 'P24', 'P25', 'P26'] : ['P7', 'P8'];
        } else if (config.name === 'C-17') {
          return ['P15', 'P16', 'P17', 'P18'];
        } else {
          return ['P7', 'P8'];
        }
      };
      const aftPositions = getAftPositions();
      const dgNotInAft = dangerousPositions.some(pos => !aftPositions.includes(pos.id));
      
      if (dgNotInAft) {
        const aftRange = aircraftId === 'kc30a' ? (kc30aCargoType === 'LD3' ? 'P21-P26' : 'P7-P8') : (config.name === 'C-17' ? 'P15-P18' : 'P7-P8');
        const centerPositions = aircraftId === 'kc30a' ? (kc30aCargoType === 'LD3' ? 'P6-P8 and P19-P21' : 'P3-P6') : (config.name === 'C-17' ? 'P4-P6 and P13-P15' : 'P3-P4 and P7-P8');
        const optimalCG = (config.forwardLimit + config.aftLimit) / 2;
        return `🔄 SAFETY & BALANCE OPTIMIZATION: Dangerous goods should be moved to aft positions (${aftRange}) for emergency jettison capability. Current CG: ${balanceResult.centerOfGravity.toFixed(1)}%, target: ${optimalCG.toFixed(1)}%. For optimal balance, place heavy cargo in center positions (${centerPositions}) and maintain DG safety protocols.`;
      }
    }
    
    // Safety and balance recommendations
    if (message.includes('balance') || message.includes('weight') || message.includes('optimize')) {
      const getCenterPositions = () => {
        if (aircraftId === 'kc30a') {
          return kc30aCargoType === 'LD3' ? 'P6-P8 and P19-P21' : 'P3-P6';
        }
        return config.name === 'C-17' ? 'P4-P6 and P13-P15' : 'P3-P4 and P7-P8';
      };
      const centerPositions = getCenterPositions();
      const optimalCG = (config.forwardLimit + config.aftLimit) / 2;
      
      if (status === 'critical') {
        return `⚠️ CRITICAL BALANCE ISSUE: Your current load is ${balance > 0 ? 'too aft' : 'too forward'}. IMMEDIATE ACTION: Move heavy items to center positions (${centerPositions}) to achieve optimal center of gravity at ${optimalCG.toFixed(1)}%. This will provide maximum stability and performance.`;
      } else if (status === 'warning') {
        return `⚡ Balance is approaching limits. Current CG: ${balanceResult.centerOfGravity.toFixed(1)}%. OPTIMIZATION: Move cargo closer to center positions (${centerPositions}) for optimal CG at ${optimalCG.toFixed(1)}%. Even within limits, center loading provides better aircraft handling.`;
      } else {
        return `✅ Balance is within limits (CG: ${balanceResult.centerOfGravity.toFixed(1)}%). OPTIMIZATION OPPORTUNITY: For maximum efficiency and handling, redistribute cargo to center positions (${centerPositions}). Target optimal CG: ${optimalCG.toFixed(1)}%. Center loading reduces structural stress and improves fuel efficiency.`;
      }
    }
    
    if (hasDangerousGoods || message.includes('rear') || message.includes('emergency')) {
      return `🔥 DANGEROUS GOODS SAFETY: Always place dangerous goods (DG) toward the rear of the aircraft. This allows for emergency jettison if needed. Rear positions like ${config.name === 'C-17' ? 'P15-P18' : 'P7-P8'} are ideal for DG cargo. Never place DG near crew areas or fuel systems.`;
    }
    
    if (message.includes('heavy') || message.includes('distribution')) {
      const getCenterPositions = () => {
        if (aircraftId === 'kc30a') {
          return kc30aCargoType === 'LD3' ? 'P6-P8 and P19-P21' : 'P3-P6';
        }
        return config.name === 'C-17' ? 'P4-P6 and P13-P15' : 'P3-P4 and P7-P8';
      };
      const centerPositions = getCenterPositions();
      const optimalCG = (config.forwardLimit + config.aftLimit) / 2;
      return `📦 HEAVY CARGO OPTIMIZATION: Always prioritize center positions (${centerPositions}) for heavy items. This achieves optimal CG at ${optimalCG.toFixed(1)}% and minimizes structural stress. Distribute evenly across center positions rather than concentrating weight. Avoid forward/aft positions unless necessary for balance correction.`;
    }
    
    if (message.includes('center') || message.includes('cg')) {
      const optimalCG = (config.forwardLimit + config.aftLimit) / 2;
      const getCenterPositions = () => {
        if (aircraftId === 'kc30a') {
          return kc30aCargoType === 'LD3' ? 'P6-P8 and P19-P21' : 'P3-P6';
        }
        return config.name === 'C-17' ? 'P4-P6 and P13-P15' : 'P3-P4 and P7-P8';
      };
      const centerPositions = getCenterPositions();
      return `⚖️ CENTER OF GRAVITY OPTIMIZATION: Current CG: ${balanceResult.centerOfGravity.toFixed(1)}%. Target optimal CG: ${optimalCG.toFixed(1)}%. Legal range: ${config.forwardLimit}%-${config.aftLimit}%. For best performance, place all cargo in center positions (${centerPositions}) to achieve optimal CG and minimize fuel consumption.`;
    }
    
    if (message.includes('positions') || message.includes('where')) {
      const getCenterPositions = () => {
        if (aircraftId === 'kc30a') {
          return kc30aCargoType === 'LD3' ? 'P6-P8 and P19-P21' : 'P3-P6';
        }
        return config.name === 'C-17' ? 'P4-P6 and P13-P15' : 'P3-P4 and P7-P8';
      };
      const centerPositions = getCenterPositions();
      const optimalCG = (config.forwardLimit + config.aftLimit) / 2;
      return `📍 OPTIMAL POSITION STRATEGY: ${config.name} has ${aircraftId === 'kc30a' ? (kc30aCargoType === 'LD3' ? '26' : '8') : config.positions} positions. PRIORITY ORDER: 1) Center positions (${centerPositions}) for optimal CG at ${optimalCG.toFixed(1)}%. 2) Use forward/aft positions only for fine balance adjustment. Always start with center loading for maximum efficiency.`;
    }
    
    // Default helpful response
    return `🚁 LOADMASTER ASSISTANT: I can help with cargo balance, dangerous goods placement, weight distribution, and safety recommendations. Try asking about "balance optimization", "dangerous goods safety", or "heavy cargo distribution". What specific guidance do you need?`;
  };

  const handleChatSubmit = () => {
    if (!chatInput.trim()) return;
    
    // Add user message
    const userMessage = {
      type: 'user' as const,
      message: chatInput,
      timestamp: new Date()
    };
    
    // Generate AI response
    const aiResponse = {
      type: 'bot' as const,
      message: generateAIResponse(chatInput),
      timestamp: new Date()
    };
    
    setChatMessages(prev => [...prev, userMessage, aiResponse]);
    setChatInput("");
  };

  const handleAnalyzeBalance = () => {
    const analysisMessage = {
      type: 'user' as const,
      message: "Analyze my current load balance",
      timestamp: new Date()
    };
    
    const aiResponse = {
      type: 'bot' as const,
      message: generateAIResponse("analyze balance weight optimize"),
      timestamp: new Date()
    };
    
    setChatMessages(prev => [...prev, analysisMessage, aiResponse]);
  };

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

      // Try to capture screenshot as enhancement (fallback gracefully)
      try {
        const canvas = await html2canvas(cargoBayElement, {
          backgroundColor: '#1f2937',
          scale: 1,
          useCORS: false,
          allowTaint: true,
          logging: false,
          foreignObjectRendering: false
        });

        const imgData = canvas.toDataURL('image/png');
        const imgWidth = pageWidth - 40;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        const yPosition = yPos + 10;
        const maxHeight = pageHeight - yPosition - 20;
        const finalHeight = Math.min(imgHeight, maxHeight);
        const finalWidth = finalHeight === maxHeight ? (canvas.width * maxHeight) / canvas.height : imgWidth;
        
        if (finalHeight > 0 && finalWidth > 0) {
          pdf.addImage(imgData, 'PNG', 20, yPosition, finalWidth, finalHeight);
        }
      } catch (screenshotError) {
        console.warn('Visual layout capture failed, using text summary only:', screenshotError);
      }

      const fileName = `${config.name}_LoadPlan_${new Date().toISOString().split('T')[0]}.pdf`;

      if (shouldEmail && emailAddress) {
        try {
          setEmailSending(true);
          
          // Convert PDF to base64 for email
          const pdfBase64 = pdf.output('datauristring').split(',')[1];
          
          // Create abort controller with timeout
          const controller = new AbortController();
          const timeoutId = setTimeout(() => {
            controller.abort();
          }, 15000); // 15 second timeout
          
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
            const errorText = await response.text();
            console.error('Email sending failed:', errorText);
            
            // Fall back to download
            pdf.save(fileName);
            alert('Email failed - PDF downloaded instead. Email service may need configuration.');
            setShowEmailDialog(false);
          }
        } catch (emailError: any) {
          console.error('Email request failed:', emailError);
          
          // Fall back to download
          pdf.save(fileName);
          if (emailError?.name === 'AbortError') {
            alert('Email timeout - PDF downloaded instead. Please try again or check your connection.');
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
              Max Positions: {aircraftId === 'kc30a' ? (kc30aCargoType === 'LD3' ? '26' : '8') : config.positions}
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
                  <div className="absolute inset-0 bg-gradient-to-r from-red-500 via-green-500 to-red-500 opacity-30"></div>
                  
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

        {/* PDF Export Section */}
        <Card className="bg-card mb-4">
          <CardHeader>
            <CardTitle className="text-card-foreground flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Export Load Plan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button 
                onClick={handleDownloadPDF}
                disabled={isExporting}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Download className="h-4 w-4 mr-2" />
                {isExporting ? 'Generating...' : 'Download PDF'}
              </Button>
              <Button 
                variant="outline"
                onClick={handleEmailPDF}
                disabled={isExporting}
                className="border-blue-500 text-blue-400 hover:bg-blue-500/10 hover:text-blue-300"
              >
                <Mail className="h-4 w-4 mr-2" />
                Email PDF
              </Button>
              <div className="text-sm text-muted-foreground flex items-center">
                Exports cargo bay layout with CG: {balanceResult.centerOfGravity.toFixed(1)}%
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cargo Positions */}
        <Card className="bg-card mb-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-card-foreground">Cargo Bay Layout</CardTitle>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  const aiSection = document.querySelector('#ai-assistant-section');
                  aiSection?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="border-orange-500 text-orange-400 hover:bg-orange-500/10 hover:text-orange-300"
              >
                <Bot className="h-4 w-4 mr-2" />
                AI Assistant
              </Button>
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
                      <Select value={kc30aCargoType} onValueChange={(value: 'LD3' | 'Pallets') => setKc30aCargoType(value)}>
                        <SelectTrigger className="w-40 bg-gray-800 border-gray-600">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-600">
                          <SelectItem value="LD3">LD3 Containers</SelectItem>
                          <SelectItem value="Pallets">463L Pallets</SelectItem>
                        </SelectContent>
                      </Select>
                      <div className="text-xs text-muted-foreground">
                        {kc30aCargoType === 'LD3' ? '26 positions (2×13)' : '8 positions (1×8)'}
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



        {/* AI Load Planning Assistant Section */}
        <Card id="ai-assistant-section" className="bg-card border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Load Planning Assistant</CardTitle>
              </div>
              <Button 
                onClick={handleAnalyzeBalance}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
                size="sm"
              >
                <Scale className="h-4 w-4 mr-2" />
                Analyse Balance
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Chat Messages */}
            <div className="h-64 overflow-y-auto space-y-3 mb-4 p-3 bg-muted/30 rounded-lg">
              {chatMessages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-3 rounded-lg text-sm ${
                    msg.type === 'user' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-card text-card-foreground border border-border'
                  }`}>
                    {msg.message}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Chat Input */}
            <div className="flex gap-2">
              <Textarea
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask about balance, dangerous goods, or cargo placement..."
                className="flex-1 min-h-0 h-10 resize-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleChatSubmit();
                  }
                }}
              />
              <Button 
                onClick={handleChatSubmit}
                size="sm"
                className="h-10 w-10 p-0 bg-primary hover:bg-primary/90"
              >
                <Send className="h-4 w-4" />
              </Button>
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
                  (kc30aCargoType === 'LD3' ? 1478 : 4404) : 
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