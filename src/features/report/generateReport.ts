import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { supabase } from '@/lib/supabase';
import { categoryLabel, conditionLabel } from '@/features/clubs/schemas';
import type { ClubWithPhotos } from '@/features/clubs/hooks';
import type { Bag, Profile } from '@/lib/database.types';

const REPORT_URL_TTL_SECONDS = 15 * 60;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function row(label: string, value: string | null): string {
  if (value === null || value === '') return '';
  return `<tr><td class="label">${label}</td><td>${escapeHtml(value)}</td></tr>`;
}

/**
 * Genera un PDF con el inventario completo de la bolsa (fotos + datos,
 * números de serie destacados) y abre la hoja de compartir. Pensado como
 * respaldo ante el seguro o una denuncia por robo.
 */
export async function exportBagReport(options: {
  profile: Profile;
  bag: Bag;
  clubs: ClubWithPhotos[];
}): Promise<void> {
  const { profile, bag, clubs } = options;

  // URLs firmadas de corta duración solo para renderizar el PDF.
  const paths = clubs.flatMap((club) => club.club_photos.map((photo) => photo.storage_path));
  const urlByPath: Record<string, string> = {};
  if (paths.length > 0) {
    const { data, error } = await supabase.storage
      .from('club-photos')
      .createSignedUrls(paths, REPORT_URL_TTL_SECONDS);
    if (error) throw error;
    for (const entry of data) {
      if (entry.signedUrl && entry.path) urlByPath[entry.path] = entry.signedUrl;
    }
  }

  const totalValue = clubs.reduce((sum, club) => sum + (club.estimated_value ?? 0), 0);
  const generatedAt = new Date().toLocaleString('es', { dateStyle: 'long', timeStyle: 'short' });

  const clubSections = clubs
    .map((club, index) => {
      const photos = [...club.club_photos]
        .sort((a, b) => Number(b.is_primary) - Number(a.is_primary))
        .map((photo) => urlByPath[photo.storage_path])
        .filter((url): url is string => url !== undefined)
        .map((url) => `<img src="${url}" />`)
        .join('');

      return `
        <section class="club">
          <h2>${index + 1}. ${escapeHtml(categoryLabel(club.category))} — ${escapeHtml(club.brand)} ${escapeHtml(club.model)}</h2>
          ${club.serial_number ? `<p class="serial">N.º de serie: <strong>${escapeHtml(club.serial_number)}</strong></p>` : ''}
          <table>
            ${row('Categoría', categoryLabel(club.category))}
            ${row('Marca', club.brand)}
            ${row('Modelo', club.model)}
            ${row('Loft', club.loft !== null ? `${club.loft}°` : null)}
            ${row('Flex del shaft', club.shaft_flex)}
            ${row('Material del shaft', club.shaft_material)}
            ${row('Estado', conditionLabel(club.condition))}
            ${row('Fecha de compra', club.purchase_date)}
            ${row('Valor estimado', club.estimated_value !== null ? `$${club.estimated_value.toLocaleString('es')}` : null)}
            ${row('Notas', club.notes)}
            ${row('Registrado el', new Date(club.created_at).toLocaleDateString('es'))}
          </table>
          <div class="photos">${photos}</div>
        </section>`;
    })
    .join('');

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8" />
<style>
  body { font-family: -apple-system, 'Helvetica Neue', Arial, sans-serif; color: #111; margin: 32px; }
  header { border-bottom: 3px solid #16a34a; padding-bottom: 16px; margin-bottom: 24px; }
  h1 { margin: 0 0 4px; font-size: 26px; }
  .meta { color: #555; font-size: 13px; line-height: 1.6; }
  .summary { background: #f4f7f5; border-radius: 8px; padding: 12px 16px; margin-bottom: 24px; font-size: 14px; }
  .club { page-break-inside: avoid; border: 1px solid #ddd; border-radius: 8px; padding: 16px; margin-bottom: 16px; }
  .club h2 { font-size: 17px; margin: 0 0 8px; }
  .serial { background: #fff8e1; border: 1px solid #e6c200; border-radius: 6px; padding: 6px 10px; font-size: 13px; display: inline-block; }
  table { border-collapse: collapse; width: 100%; font-size: 13px; margin-top: 8px; }
  td { padding: 4px 8px; border-bottom: 1px solid #eee; vertical-align: top; }
  td.label { color: #666; width: 160px; }
  .photos { margin-top: 12px; }
  .photos img { height: 160px; border-radius: 6px; margin: 0 8px 8px 0; object-fit: cover; }
  footer { margin-top: 32px; color: #888; font-size: 11px; }
</style>
</head>
<body>
  <header>
    <h1>TrackBag — Inventario de bolsa</h1>
    <div class="meta">
      Propietario: <strong>${escapeHtml(profile.full_name)}</strong><br />
      Bolsa: ${escapeHtml(bag.name)}<br />
      Generado: ${escapeHtml(generatedAt)}
    </div>
  </header>
  <div class="summary">
    <strong>${clubs.length}</strong> palo(s) registrados
    ${totalValue > 0 ? ` · Valor estimado total: <strong>$${totalValue.toLocaleString('es')}</strong>` : ''}
  </div>
  ${clubSections}
  <footer>
    Documento generado por TrackBag como registro del inventario del propietario.
    Las fotos y números de serie pueden presentarse ante el club, la aseguradora o la policía en caso de robo.
  </footer>
</body>
</html>`;

  const { uri } = await Print.printToFileAsync({ html });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: 'Reporte de bolsa TrackBag',
      UTI: 'com.adobe.pdf',
    });
  }
}
