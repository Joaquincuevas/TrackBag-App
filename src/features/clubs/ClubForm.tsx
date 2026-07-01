import { useState, type ReactNode } from 'react';
import { StyleSheet, Text } from 'react-native';
import type { Club, ClubCategory, ClubCondition } from '@/lib/database.types';
import { zodFieldErrors } from '@/shared/lib/formErrors';
import { TextField } from '@/shared/ui/TextField';
import { ChipSelect } from '@/shared/ui/ChipSelect';
import { Button } from '@/shared/ui/Button';
import { colors, spacing, typography } from '@/theme';
import { CLUB_CATEGORIES, CLUB_CONDITIONS, clubFormSchema, type ClubFormOutput } from './schemas';

type Props = {
  /** Datos actuales al editar; omitir al crear. */
  initial?: Club;
  submitLabel: string;
  submitting: boolean;
  formError?: string | null;
  onSubmit: (output: ClubFormOutput) => void;
  /** Sección de fotos u otro contenido encima del formulario. */
  children?: ReactNode;
};

export function ClubForm({ initial, submitLabel, submitting, formError, onSubmit, children }: Props) {
  const [category, setCategory] = useState<ClubCategory | null>(initial?.category ?? null);
  const [brand, setBrand] = useState(initial?.brand ?? '');
  const [model, setModel] = useState(initial?.model ?? '');
  const [loft, setLoft] = useState(initial?.loft !== null && initial !== undefined ? String(initial.loft) : '');
  const [shaftFlex, setShaftFlex] = useState(initial?.shaft_flex ?? '');
  const [shaftMaterial, setShaftMaterial] = useState(initial?.shaft_material ?? '');
  const [serialNumber, setSerialNumber] = useState(initial?.serial_number ?? '');
  const [condition, setCondition] = useState<ClubCondition>(initial?.condition ?? 'bueno');
  const [purchaseDate, setPurchaseDate] = useState(initial?.purchase_date ?? '');
  const [estimatedValue, setEstimatedValue] = useState(
    initial?.estimated_value !== null && initial !== undefined ? String(initial.estimated_value) : '',
  );
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function handleSubmit() {
    const parsed = clubFormSchema.safeParse({
      category,
      brand,
      model,
      loft,
      shaftFlex,
      shaftMaterial,
      serialNumber,
      condition,
      purchaseDate,
      estimatedValue,
      notes,
    });
    if (!parsed.success) {
      setFieldErrors(zodFieldErrors(parsed.error));
      return;
    }
    setFieldErrors({});
    onSubmit(parsed.data);
  }

  return (
    <>
      {children}

      <ChipSelect
        label="Categoría"
        options={CLUB_CATEGORIES}
        value={category}
        onChange={setCategory}
        error={fieldErrors.category}
      />
      <TextField
        label="Marca"
        value={brand}
        onChangeText={setBrand}
        error={fieldErrors.brand}
        placeholder="Titleist, TaylorMade, Callaway…"
      />
      <TextField
        label="Modelo"
        value={model}
        onChangeText={setModel}
        error={fieldErrors.model}
        placeholder="TSR3, Stealth 2…"
      />
      <TextField
        label="Número de serie"
        optional
        value={serialNumber}
        onChangeText={setSerialNumber}
        error={fieldErrors.serialNumber}
        autoCapitalize="characters"
        placeholder="Recomendado: es tu prueba ante un robo"
      />
      <ChipSelect
        label="Estado"
        options={CLUB_CONDITIONS}
        value={condition}
        onChange={setCondition}
        error={fieldErrors.condition}
      />
      <TextField
        label="Loft (°)"
        optional
        value={loft}
        onChangeText={setLoft}
        error={fieldErrors.loft}
        keyboardType="numbers-and-punctuation"
        placeholder="10.5"
      />
      <TextField
        label="Flex del shaft"
        optional
        value={shaftFlex}
        onChangeText={setShaftFlex}
        error={fieldErrors.shaftFlex}
        placeholder="Regular, Stiff, X-Stiff…"
      />
      <TextField
        label="Material del shaft"
        optional
        value={shaftMaterial}
        onChangeText={setShaftMaterial}
        error={fieldErrors.shaftMaterial}
        placeholder="Grafito, acero…"
      />
      <TextField
        label="Fecha de compra"
        optional
        value={purchaseDate}
        onChangeText={setPurchaseDate}
        error={fieldErrors.purchaseDate}
        placeholder="AAAA-MM-DD"
        autoCapitalize="none"
      />
      <TextField
        label="Valor estimado"
        optional
        value={estimatedValue}
        onChangeText={setEstimatedValue}
        error={fieldErrors.estimatedValue}
        keyboardType="numbers-and-punctuation"
        placeholder="450"
      />
      <TextField
        label="Notas"
        optional
        value={notes}
        onChangeText={setNotes}
        error={fieldErrors.notes}
        multiline
        numberOfLines={3}
        style={styles.notes}
        placeholder="Grip nuevo, marca en la corona…"
      />

      {formError != null && <Text style={styles.formError}>{formError}</Text>}

      <Button title={submitLabel} onPress={handleSubmit} loading={submitting} />
    </>
  );
}

const styles = StyleSheet.create({
  notes: {
    minHeight: 88,
    textAlignVertical: 'top',
  },
  formError: {
    ...typography.callout,
    color: colors.danger,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
});
