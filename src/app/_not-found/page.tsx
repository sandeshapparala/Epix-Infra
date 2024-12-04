// src/app/_not-found/page.tsx

export const metadata = {
  title: "Page Not Found",
  description: "This page could not be found.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

const NotFoundPage: React.FC = () => {
  return (
    <div>
      <h1>404 - Page Not Found</h1>
    </div>
  );
};

export default NotFoundPage;