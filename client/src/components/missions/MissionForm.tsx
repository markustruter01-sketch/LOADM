import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertMissionSchema, type InsertMission } from "@shared/schema";
import { AIRCRAFT_LABELS, AIRCRAFT_TYPES, type AircraftType } from "@shared/constants";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const EMPTY_MISSION: InsertMission = {
  missionName: "",
  aircraft: "C130J",
  aircraftCallSign: "",
  captainName: "",
  departureLocation: "",
  arrivalDestination: "",
  loadmaster1Name: "",
  loadmaster2Name: null,
  hasDangerousGoods: false,
};

type TextField = "missionName" | "aircraftCallSign" | "captainName" | "departureLocation" | "arrivalDestination" | "loadmaster1Name";

const TEXT_FIELDS: Array<{ name: TextField; label: string; placeholder: string }> = [
  { name: "missionName", label: "Mission name", placeholder: "Op RESOLUTE resupply" },
  { name: "aircraftCallSign", label: "Call sign", placeholder: "DRGN21" },
  { name: "captainName", label: "Captain", placeholder: "SQNLDR Price" },
  { name: "departureLocation", label: "Departure", placeholder: "YAMB" },
  { name: "arrivalDestination", label: "Destination", placeholder: "YPDN" },
  { name: "loadmaster1Name", label: "Loadmaster 1", placeholder: "SGT S. Mackenzie" },
];

export function MissionForm({
  defaultValues = EMPTY_MISSION,
  submitLabel,
  pending,
  onSubmit,
  onCancel,
}: {
  defaultValues?: InsertMission;
  submitLabel: string;
  pending?: boolean;
  onSubmit: (values: InsertMission) => void;
  onCancel?: () => void;
}) {
  const form = useForm<InsertMission>({ resolver: zodResolver(insertMissionSchema), defaultValues });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((v) => onSubmit({ ...v, loadmaster2Name: v.loadmaster2Name?.trim() ? v.loadmaster2Name.trim() : null }))}
        className="space-y-4"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {TEXT_FIELDS.map((f) => (
            <FormField
              key={f.name}
              control={form.control}
              name={f.name}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{f.label}</FormLabel>
                  <FormControl>
                    <Input placeholder={f.placeholder} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}
          <FormField
            control={form.control}
            name="loadmaster2Name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Loadmaster 2 (optional)</FormLabel>
                <FormControl>
                  <Input placeholder="CPL J. Nguyen" value={field.value ?? ""} onChange={field.onChange} onBlur={field.onBlur} name={field.name} ref={field.ref} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="aircraft"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Aircraft</FormLabel>
                <Select value={field.value} onValueChange={(v) => field.onChange(v as AircraftType)}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {AIRCRAFT_TYPES.map((a) => (
                      <SelectItem key={a} value={a}>
                        {AIRCRAFT_LABELS[a]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="hasDangerousGoods"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-md border border-border/60 p-3">
              <div>
                <FormLabel>Dangerous goods on board</FormLabel>
                <p className="text-xs text-muted-foreground">Flags the mission for DG documentation and checks.</p>
              </div>
              <FormControl>
                <Switch checked={!!field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  );
}
