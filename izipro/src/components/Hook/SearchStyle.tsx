// style for the autocomplete component
export const autocompleteSx = {
  // Modifier l'input quand il est en focus
  '& .MuiOutlinedInput-root': {
    '&:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: 'transparent', // Supprime la bordure lors du survol
    },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: 'transparent', // Supprime la bordure lors du focus
    },
  },
  '& .MuiAutocomplete-inputRoot': {
    marginTop: '0.8rem',
    marginBottom: '0.4rem',
    borderRadius: '0.5rem',
    height: '2.5rem',
    fontFamily: 'Fredoka, sans-serif',
    backgroundColor: '#ffffff',
    '&:hover': {
      borderColor: 'transparent',
      border: 'none',
    },
  },
  // Cibler la bordure du notchedOutline
  '& .MuiOutlinedInput-notchedOutline': {
    borderColor: 'white', // Applique une bordure blanche par défaut
  },
  // Modifier le label
  '& .MuiFormLabel-root': {
    fontFamily: 'Fredoka, sans-serif',
    top: '5px',
  },
  // Appliquer le style quand le label est shrinké
  '& .MuiFormLabel-root[data-shrink="true"]': {
    transform: 'none', // Supprime l'effet de transformation
    borderColor: 'transparent',
    left: '0.5rem',
    top: '-0.3rem',
    fontWeight: '400',
    fontSize: '0.9rem',
  },
  // Modifier la liste des options
  '& .MuiAutocomplete-listbox': {
    fontFamily: 'Fredoka, sans-serif',
    padding: 0, // Enlever l'espacement inutile
    '& .MuiAutocomplete-option': {
      padding: '8px 16px', // Contrôler l'espacement entre les lignes
      fontSize: '0.9rem',
      lineHeight: 1.2, // Réduire l'espacement entre les lignes
      '&:hover': {
        backgroundColor: '#f0f0f0', // Couleur de fond sur hover
        color: '#333', // Couleur du texte sur hover
      },
      '&[aria-selected="true"]': {
        backgroundColor: '#e0e0e0', // Couleur pour l'option sélectionnée
        color: '#000',
      },
    },
  },
};

export const popperSx = {
  '& .MuiAutocomplete-paper': {
    scrollbarWidth: 'thin', // Ajoute une scrollbar fine
    '-webkit-scrollbar': {
      width: '6px', // Largeur de la scrollbar pour WebKit
      height: '6px', // Hauteur de la scrollbar pour WebKit
    },
    borderRadius: '0.5rem', // Ajout du border-radius
    overflow: 'hidden', // Garantit que le contenu respecte les coins arrondis
    boxShadow: '0  6px 5px rgba(0, 0, 0, 0.288)', // Esthétique optionnelle
  },
  // Cible également la liste déroulante
  '& .MuiAutocomplete-listbox': {
    fontFamily: 'Fredoka, sans-serif',
    borderRadius: '0.5rem', // Coins arrondis pour le contenu
    // maxHeight: '200px', // Limite la hauteur de la liste si nécessaire
  },
  '& .MuiAutocomplete-option': {
    //padding: '8px 16px', // Contrôle l'espacement interne des lignes
    fontSize: '1rem', // Taille de texte (optionnel)
    lineHeight: 1.2, // Réduit l'espacement entre lignes
    color: '#5c5a5a', // Couleur du texte
    transition: 'background-color 0.2s ease', // Ajoute une transition douce
    '&:hover': {
      backgroundColor: '#3da3ec60 !important', // Couleur du hover
      color: '#5c5a5a', // Couleur du texte sur hover
    },
  },
};
