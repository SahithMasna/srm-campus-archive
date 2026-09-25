import './globals.css';

export const metadata = {
  title: 'SRM Campus Visual Archive',
  description: 'A verified, student-powered visual map of SRM University-AP campus life.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
