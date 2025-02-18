import { useTimerStore } from "../store/useTimerStore";

export default function SessionMobileCount() {
  const { sessions, currentSession } = useTimerStore();
  return (
    <div className="block sm:hidden">
      <p className="xs:text-3xl mr-1 text-2xl font-extrabold">
        {currentSession} / {sessions}
      </p>
    </div>
  );
}
