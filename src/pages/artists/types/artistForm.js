// Initial state factory
export const createInitialArtistFormState = () => ({
    basic: {
        name: '',
        bio: '',
        website: '',
        imageUrl: '',
    },
    social: {
        instagram: '',
        twitter: '',
        facebook: '',
        tiktok: '',
        youtube: '',
    },
    music: {
        tracks: [],
        isAddTrackModalOpen: false,
        editingTrack: null,
    },
    genres: [],
});
