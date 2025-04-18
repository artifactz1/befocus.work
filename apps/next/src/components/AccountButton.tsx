// import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/tooltip';
// import { User } from 'lucide-react';
// import { useRouter } from 'next/navigation';
// import { useEffect, useState } from 'react';
// import { api } from '~/lib/api.client';
// import MenuButton from './MenuButtons';

// export default function AccountButton() {

//   const iconSize = "md:h-5 xl:h-6 ";
//   const router = useRouter()
//   const [isSmallScreen, setIsSmallScreen] = useState(false);
//   const buttonVariant = isSmallScreen ? "ghost" : "outline";

//   useEffect(() => {
//     const handleResize = () => {
//       setIsSmallScreen(window.innerWidth < 768); // 'sm' breakpoint is 640px
//     };

//     handleResize(); // Set initial state
//     window.addEventListener("resize", handleResize);

//     return () => window.removeEventListener("resize", handleResize);
//   }, []);

//   async function isLoggedIn() {

//     try {
//       const res = await api.user.session.$get(); // This calls your /user/session route

//       // Assuming res has a 'data' field with user info
//       console.log('User session:', res);

//       // Example: Save to localStorage
//       localStorage.setItem('user', JSON.stringify(res));

//       if(res)
//       {
//         return true;
//       }
//       return false;

//       // You could also call your backend to sync something here
//     } catch (err) {
//       console.error('No user session found:', err);

//       // Save something to client regardless
//       localStorage.setItem('user', 'guest');
//     }

//     // if logged in saveon the backend
//     // no matter what save on the client
//   }

//   return (
//     <TooltipProvider>
//       <Tooltip>
//         <TooltipTrigger asChild>
//           <MenuButton
//             onClick={() => router.push('/sign-in')}
//             variant={buttonVariant}
//             className="xl:h-12 xl:w-32"
//           >
//             <User className={`${iconSize}`} strokeWidth={3} />
//           </MenuButton>
//         </TooltipTrigger>
//         <TooltipContent className="font-bold">
//           { isLoggedIn()? "Account" : "SignIn" }
//           </TooltipContent>
//       </Tooltip>
//     </TooltipProvider>
//   )
// }

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@repo/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/tooltip';
import { User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { signOut, useSession } from '~/lib/auth.client';
import MenuButton from './MenuButtons';

export default function AccountButton() {
  const { data } = useSession()
  const iconSize = "md:h-5 xl:h-6";
  const router = useRouter();
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const buttonVariant = isSmallScreen ? "ghost" : "outline";

  useEffect(() => {
    const handleResize = () => {
      setIsSmallScreen(window.innerWidth < 768); // 'sm' breakpoint is 640px
    };

    handleResize(); // Set initial state
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  console.log("USER DATA", data)

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/')
    } catch (error) {
      console.error('Sign out failed', error)
    }
  }

  return (
    <div>
      {
        data === null ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <MenuButton
                  onClick={() => router.push('/sign-in')}
                  variant={buttonVariant}
                  className="xl:h-12 xl:w-32"
                >
                  {/* <User className={iconSize} strokeWidth={3} /> */}
                  Sign In
                </MenuButton>
              </TooltipTrigger>
              <TooltipContent className="font-bold">
                Sign In
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          // <TooltipProvider>
          //   <Tooltip>
          //     <TooltipTrigger asChild>
          //       <MenuButton
          //         className="xl:h-12 xl:w-32"
          //       >


          //       </MenuButton>
          //     </TooltipTrigger>
          //     <TooltipContent className="font-bold">
          //       Sign In
          //     </TooltipContent>
          //   </Tooltip>
          // </TooltipProvider>
          <DropdownMenu>
            <DropdownMenuTrigger className='xl:h-12 xl:w-32' asChild>
              <MenuButton
                className="xl:h-12 xl:w-32" variant="outline">
                <User />
              </MenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem onClick={handleSignOut}>
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

        )
      }
    </div>
  );
}


// "use client"
// import { Button } from '@repo/ui/button';
// import { useRouter } from 'next/navigation';
// import Footer from '~/components/Footer';
// import GlobalSoundsPlayer from '~/components/GlobalSoundsPlayer';
// import Header from '~/components/Header';
// import Timer from '~/components/timer/Timer';
// import { signOut } from '~/lib/auth.client';

// export default function Dashboard() {
//   const router = useRouter();

//   // TODO: update use of useSession with useQueryClient
//   const handleSignOut = async () => {
//     try {
//       await signOut()
//       router.push('/sign-in')
//     } catch (error) {
//       console.error('Sign out failed', error)
//     }
//   }

//   return (
//     <div>
//       <GlobalSoundsPlayer />
//       <main className="continer px-auto flex h-screen w-screen flex-col items-center justify-center">
//         <Header />
//         <Timer />
//         <Footer />
//       </main>
//       <Button onClick={handleSignOut}>Sign Out</Button>
//     </div>
//   )
// }