export interface GigPhoto {
  id: string;             // Cloudinary public ID
  googlePhotoId: string;  // Google Photos mediaItem.id — sync only, not exposed in UI
  thumbnailUrl: string;
  fullUrl: string;
  band: string | null;
  event: string | null;
  city: string | null;
  month: string | null;   // e.g. "November"
  year: number | null;
  title: string;          // raw original title, always present
}
