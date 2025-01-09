
type SearchStyleProps = {
  isValidate?: boolean;
};

// style for the autocomplete component
export const autocompleteSx = ({isValidate= false}: SearchStyleProps) => ({
  // Modify the input when focused
  '& .MuiOutlinedInput-root': {
    '&:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: 'transparent', // Delete border when hover
    },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: 'transparent', // Delete border when focused
    },
  },
  '& .MuiAutocomplete-inputRoot': {
    marginTop: '0.8rem',
    marginBottom: '0.4rem',
    color: 'grey',
    borderRadius: '0.5rem',
    height: '2.5rem',
    fontFamily: 'Fredoka, sans-serif',
    backgroundColor: '#ffffff',
    '&:hover': {
      borderColor: 'transparent',
      border: 'none',
    },
  },

  // Border modifications
  '& .MuiOutlinedInput-notchedOutline': {
    borderColor: 'white', 
  },
  // Label modifications
  '& .MuiFormLabel-root': {
    fontFamily: 'Fredoka, sans-serif',
    top: '5px',
  },
  // Style when the label is shrinked
  '& .MuiFormLabel-root[data-shrink="true"]': {
    transform: 'none', 
    borderColor: 'transparent',
    left: '0.5rem',
    top: '-0.4rem',
    fontWeight: '400',
    color: isValidate ? 'green' : '#028eef',
    fontSize: '1rem',
  },
  // Options list modifications
  '& .MuiAutocomplete-listbox': {
    fontFamily: 'Fredoka, sans-serif',
    padding: 0, 
    '& .MuiAutocomplete-option': {
      padding: '8px 16px', 
      fontSize: '0.9rem',
      lineHeight: 1.2, 
      '&:hover': {
        backgroundColor: '#f0f0f0',
        color: '#333', 
      },
      '&[aria-selected="true"]': {
        backgroundColor: '#3da3ec60', 
        color: '#000',
      },
    },
  },
  
});

export const popperSx = {
  '& .MuiAutocomplete-paper': {
    scrollbarWidth: 'thin', 
    '-webkit-scrollbar': {
      width: '6px', 
      height: '6px', 
    },
    borderRadius: '0.5rem', 
    overflow: 'hidden', 
    boxShadow: '0  6px 5px rgba(0, 0, 0, 0.288)', 
  },
  // list modifications
  '& .MuiAutocomplete-listbox': {
    fontFamily: 'Fredoka, sans-serif',
    borderRadius: '0.5rem', 

  },
  '& .MuiAutocomplete-option': {
    fontSize: '1rem', 
    lineHeight: 1.2, 
    color: '#5c5a5a', 
    transition: 'background-color 0.2s ease', 
    '&:hover': {
      backgroundColor: '#3da3ec60 !important', 
      color: '#5c5a5a', 
    },
  },
};
