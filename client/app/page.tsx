'use client';

import { useRef } from "react";
import { useRouter } from "next/navigation";
import axios from 'axios'; 

const SERVER_URL=process.env.NEXT_PUBLIC_SERVER_URL

export default function Home() {

  const callNameRef=useRef<HTMLInputElement>(null);
  const router=useRouter();
  const userId='123';

  async function createCall(){
    if(callNameRef.current && callNameRef.current.value!==""){
      const callName=callNameRef.current?.value;
      callNameRef.current.value='';
      try{
        const res = await axios.post(`${SERVER_URL}/create-call`, {
          roomId: callName,
          userId: 123,
        });
        const data = await res.data;
        console.log(data);
        alert('call created successfully')
        router.push(`/call/${callName}`);
      }
      catch(e){
        console.error("Error creating call:", e);
      }
    }
  }

  async function joinCall(){
    if(callNameRef.current && callNameRef.current.value!==""){
      const callName=callNameRef.current?.value;
      callNameRef.current.value='';
      try{
        const res = await fetch("http://localhost:8080/join-call", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ roomId : callName}),
        });
        const data = await res.json();
        console.log(data);
        alert('call joined successfully')
        router.push(`/call/${callName}`);
      }catch(e){
        console.error("room doesn't exists:", e);
      }
    }
  }

  return (
    <div className="font-sans flex flex-col min-h-screen  px-32 py-8 gap-12">

        <div className="flex gap-4 items-center">

          <div className="flex gap-2 text-sm text-white">
            Enter Room Name : 
            <input ref={callNameRef} type="text" className="px-2 text-zinc-400 outline-none border-b border-b-solid border-b-white/[.145]"/>
          </div>

          <div onClick={createCall} className="rounded-full cursor-pointer border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:w-auto">
            Create Call
          </div>

          <div onClick={joinCall} className="rounded-full cursor-pointer border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full sm:w-auto md:w-[158px]">
            Join Call
          </div>
          
        </div>

    </div>
  );
}
