type SessionsDisplayProps = {
  currentSessions: number;
  sessions: number;
};

export default function SessionsDisplay({
  currentSessions,
  sessions,
}: SessionsDisplayProps) {
  return (
    <div>
      {currentSessions}/{sessions}
    </div>
  );
}
