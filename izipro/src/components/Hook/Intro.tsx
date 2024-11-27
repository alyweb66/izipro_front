import { userDataStore } from '../../store/UserData';
import '../../styles/Intro.scss';

const Intro: React.FC = () => {
  const role = userDataStore((state) => state.role);
  return (
    <div className="intro-container">
      <h1 className="intro-title">Bienvenue sur Toupro</h1>
      <p className="intro-description">
        Vous êtes actuellement sur l'onglet{' '}
        <strong className="intro-list-item__strong">
          {role === 'pro' ? 'MES\u00A0CLIENTS' : 'MES\u00A0DEMANDES'}
        </strong>{' '}
        qui sera votre page d'accueil
      </p>
      <p className="intro-note">
        Remplissez vos informations dans l'onglet{' '}
        <strong className="intro-list-item__strong">MON&nbsp;COMPTE</strong>
        {window.innerWidth < 480 && (
          <>
            {' '}
            en cliquant sur l'icone{' '}
            <img
              src="/images/Burger-menu.png"
              alt="icone-menu"
              className="intro-icon"
            />
          </>
        )}{' '}
        afin de pouvoir profiter des fonctionnalités qui s'offrent à vous :
      </p>
      <ul className="intro-list">
        <li className="intro-list-item">
          <strong className="intro-list-item__strong">DEMANDE</strong>
          <p>
            Vous permet de créer une demande qui sera envoyée aux professionnels
          </p>
        </li>
        <li className="intro-list-item">
          <strong className="intro-list-item__strong">MES DEMANDES</strong>
          <p>
            Vous permet de voir la liste de vos demandes ainsi que vos
            conversations avec les professionnels
          </p>
        </li>
        {role === 'pro' && (
          <li className="intro-list-item">
            <strong className="intro-list-item__strong">CLIENTS</strong>
            <p>
              Vous permet de voir la liste des demandes en fonction de vos
              métiers choisis et de la distance
            </p>
          </li>
        )}
        {role === 'pro' && (
          <li className="intro-list-item">
            <strong className="intro-list-item__strong">MES CLIENTS</strong>
            <p>
              Vous permet de voir la liste des demandes auxquelles vous avez
              répondu
            </p>
          </li>
        )}
        <li className="intro-list-item">
          <strong className="intro-list-item__strong">MON COMPTE</strong>
          <p>Vous permet de voir et modifier votre profil</p>
        </li>
      </ul>
    </div>
  );
};

export default Intro;
