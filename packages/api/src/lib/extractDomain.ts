export function extractDomain(url: string): string {
  try {
    const hostname = new URL(url).hostname;
    const domainParts = hostname.split('.');
    // Assuming you want the last two parts of the domain (e.g., zachuri.com)
    if (domainParts.length > 1) {
      return `.${domainParts.slice(-2).join('.')}`;
    }
    return hostname;
  } catch (error) {
    console.error('Invalid URL:', error);
    return '';
  }
}