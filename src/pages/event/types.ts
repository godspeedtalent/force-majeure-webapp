export interface ArtistSummary {
  id?: string;
  name: string;
  genre: string;
  image?: string | null;
}

export interface EventDetailsRecord {
  id: string;
  title: string | null;
  headliner: ArtistSummary;
  undercard: ArtistSummary[];
  date: string;
  time: string;
  venue: string;
  heroImage: string;
  description: string | null;
}
