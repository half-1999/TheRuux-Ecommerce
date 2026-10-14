import { Link } from 'react-router-dom';

/** CMS links are validated server-side as "/path" or http(s); external ones open in a new tab. */
export function CmsLink({ href, children, ...rest }) {
  if (/^https?:\/\//i.test(href)) {
    return (
      <a href={href} target="_blank" rel="noreferrer" {...rest}>
        {children}
      </a>
    );
  }
  return (
    <Link to={href || '/'} {...rest}>
      {children}
    </Link>
  );
}
