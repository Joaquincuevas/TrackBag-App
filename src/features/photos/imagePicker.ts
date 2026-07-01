import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { Alert } from 'react-native';

export type PickedImage = {
  uri: string;
  width: number;
  height: number;
};

const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.8;

/**
 * Re-encodea la imagen a JPEG con tamaño acotado. Además de reducir peso,
 * el re-encode ELIMINA todos los metadatos EXIF (incluida la geolocalización)
 * — nunca subimos dónde vive o juega el usuario.
 */
async function sanitize(asset: ImagePicker.ImagePickerAsset): Promise<PickedImage> {
  const needsResize = Math.max(asset.width, asset.height) > MAX_DIMENSION;
  const actions: ImageManipulator.Action[] = needsResize
    ? [asset.width >= asset.height ? { resize: { width: MAX_DIMENSION } } : { resize: { height: MAX_DIMENSION } }]
    : [];

  const result = await ImageManipulator.manipulateAsync(asset.uri, actions, {
    compress: JPEG_QUALITY,
    format: ImageManipulator.SaveFormat.JPEG,
  });

  return { uri: result.uri, width: result.width, height: result.height };
}

/** Abre la cámara y devuelve la foto ya saneada (sin EXIF), o null si canceló. */
export async function takePhoto(): Promise<PickedImage | null> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) {
    Alert.alert(
      'Cámara sin permiso',
      'TrackBag necesita acceso a la cámara para fotografiar tus palos. Puedes habilitarlo en Ajustes.',
    );
    return null;
  }

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ['images'],
    quality: 1,
    exif: false,
  });
  if (result.canceled) return null;
  return sanitize(result.assets[0]);
}

/** Abre la galería y devuelve la foto ya saneada (sin EXIF), o null si canceló. */
export async function pickFromGallery(): Promise<PickedImage | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 1,
    exif: false,
  });
  if (result.canceled) return null;
  return sanitize(result.assets[0]);
}
