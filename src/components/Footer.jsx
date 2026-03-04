import { Link } from 'react-router-dom';
import { categories } from '../data/toolsData';
import './Footer.css';

export default function Footer() {
  const toolCategories = categories.filter(c => c.id !== 'all');

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__top">
          <div className="footer__brand">
            <Link to="/" className="footer__logo">
              <span className="footer__logo-icon">FN</span>
              <span className="footer__logo-text">FileNinja</span>
            </Link>
          </div>

          <div className="footer__columns">
            <div className="footer__col">
              <h4 className="footer__col-title">Tools</h4>
              <ul className="footer__list">
                {toolCategories.slice(0, 5).map(cat => (
                  <li key={cat.id}>
                    <a href="#tools" className="footer__link">{cat.label}</a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="footer__col">
              <h4 className="footer__col-title">More Tools</h4>
              <ul className="footer__list">
                {toolCategories.slice(5).map(cat => (
                  <li key={cat.id}>
                    <a href="#tools" className="footer__link">{cat.label}</a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="footer__col">
              <h4 className="footer__col-title">Company</h4>
              <ul className="footer__list">
                <li><a href="#" className="footer__link">About</a></li>
                <li><a href="#" className="footer__link">Privacy Policy</a></li>
                <li><a href="#" className="footer__link">Blog</a></li>
                <li><a href="#" className="footer__link">Contact</a></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="footer__bottom">
          <p className="footer__copy">
            {new Date().getFullYear()} FileNinja. All rights reserved.
          </p>
          <p className="footer__made">
            Made with care for your privacy.
          </p>
        </div>
      </div>
    </footer>
  );
}
