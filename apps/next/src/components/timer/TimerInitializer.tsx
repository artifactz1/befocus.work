// import { useQuery } from '@tanstack/react-query'
// import { api } from '~/lib/api.client'
// import { useTimerStore } from '~/store/useTimerStore'

// export function TimerInitializer() {
//   const hydrateFromSettings = useTimerStore((state) => state.hydrateFromSettings)

//   const { data, isLoading, error } = useQuery({
//     queryKey: ['userSettings'],
//     queryFn: async () => {
//       const res = await api.user.settings.$get()
//       if (!res.ok) throw new Error('Failed to fetch settings')
//       return res.json()
//     },
//     onSuccess: (data) => {
//       hydrateFromSettings({
//         sessions: data.numberOfSessions,
//         workDuration: data.workDuration,
//         breakDuration: data.breakDuration,
//       })
//     },
//     staleTime: 1000 * 60 * 5, // cache for 5 minutes
//   })

//   if (isLoading) return null
//   if (error) console.error(error)

//   return null
// }

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from '~/lib/api.client';
import { useTimerStore } from '~/store/useTimerStore';

export const TimerInitializer = () => {
  const hydrateFromSettings = useTimerStore((state) => state.hydrateFromSettings);

  const { data, isSuccess, isLoading, isError } = useQuery({
    queryKey: ["userSettings"],
    queryFn: async () => {
      const res = await api.user.settings.$get();
      if (!res.ok) throw new Error("Failed to fetch settings");
      return res.json();
    },
  });

  useEffect(() => {
    if (isSuccess && data) {
      hydrateFromSettings({
        sessions: data.numberOfSessions,
        workDuration: data.workDuration,
        breakDuration: data.breakDuration,
      });
    }
  }, [isSuccess, data, hydrateFromSettings]);

  if (isLoading) return <p>Loading user settings...</p>;
  if (isError) return <p>Failed to load user settings.</p>;

  return null; // This component only handles hydration
};
