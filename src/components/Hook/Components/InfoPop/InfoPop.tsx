import Popover from '@mui/material/Popover';
import Typography from '@mui/material/Typography';
import { useMemo, useState } from 'react';
import { IoMdInformationCircleOutline } from 'react-icons/io';

import './InfoPop.scss';

type InfoPopProps = {
  isPush?: boolean;
  isRequestJob?: boolean;
};

export default function InfoPop({
  isPush = false,
  isRequestJob = false,
}: InfoPopProps) {
  //state
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

  const open = Boolean(anchorEl);
  const popoverId = open ? 'simple-popover' : undefined;

  const infoPush =
    "Pour profiter des notifications push sur IOS, vous devez installer l'application sur votre écran d'accueil.";
  const infoJob =
    "Si votre métier n'est pas dans la liste, contactez-nous depuis la page 'Contact' pour faire une demande d'ajout";
  const infoRequestJob =
    "Si le métier recherché n'est pas dans la liste, contactez-nous depuis la page 'Contact' pour faire une demande d'ajout";

  // open popover
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  // close popover
  const handleClose = () => {
    setAnchorEl(null);
  };

  const infoText = useMemo(() => {
    if (isPush) {
      return infoPush;
    } else if (isRequestJob) {
      return infoRequestJob;
    } else {
      return infoJob;
    }
  }, []);

  return (
    <div className="info">
      <button
        aria-describedby="information"
        className={`info-push ${isPush ? '' : 'no-push'}`}
        onClick={handleClick}
        style={{
          background: 'none',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
        }}
      >
        <IoMdInformationCircleOutline />
      </button>
      <Popover
        id={popoverId}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
      >
        <Typography
          sx={{ p: 2 }}
          className="typo"
          style={{ fontFamily: 'Fredoka, sans-serif', fontWeight: 400 }}
        >
          {infoText}
        </Typography>
      </Popover>
    </div>
  );
}
