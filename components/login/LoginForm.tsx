import React from "react";

export default function LoginForm({ emailInputRef, passwordInputRef, onSubmit }: any) {
  return (
    <form className="w-full" onSubmit={onSubmit}>
      <label htmlFor="email" className="font-medium text-sm mb-0">
        Email
      </label>
      <input id="email" required spellCheck={false} type="email" className="border-[1px] w-full rounded outline-none p-2 mb-5 " placeholder="budi@gmail.com" ref={emailInputRef} />
      <label htmlFor="pass" className="font-medium text-sm mb-2">
        Password
      </label>
      <input required id="pass" type="password" className="border-[1px] w-full rounded outline-none p-2" placeholder="*********" ref={passwordInputRef} />
      <button type="submit" className="w-full py-4 mt-7 font-semibold text-white bg-brandPrimary600 rounded-full">
        Masuk
      </button>
    </form>
  );
}
