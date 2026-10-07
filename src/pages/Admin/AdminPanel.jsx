import PagePlaceholder from '../../components/PagePlaceholder';

export default function AdminPanel() {
  return (
    <PagePlaceholder
      title="Admin Panel"
      description="User management: browse accounts, force logouts and soft-delete users. Wired to the admin API. Visible to Admin and SuperAdmin roles only."
      icon={
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      }
    />
  );
}
