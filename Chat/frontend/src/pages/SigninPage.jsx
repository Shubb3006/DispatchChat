import React, { useState } from "react";
import toast from "react-hot-toast";
import { useAuthStore } from "../store/useAuthStore";
import { Loader2, Eye, EyeOff, LogIn } from "lucide-react";
import { BrandMark } from "../components/BrandLogo";

const SigninPage = () => {
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const { signin, isSigningIn } = useAuthStore();

  const validateform = () => {
    const cleanUsername = formData.username.trim();
    const cleanPassword = formData.password.trim();

    if (!cleanUsername) {
      toast.error("Username is Required");
      return false;
    }
    if (!cleanPassword) {
      toast.error("Password is Required");
      return false;
    }

    return true;
  };

  function handleSubmit(e) {
    e.preventDefault();
    if (validateform()) {
      signin({
        username: formData.username.trim(),
        password: formData.password.trim(),
      });
    }
  }

  return (
    <div className="grid-canvas flex min-h-[calc(100vh-64px)] items-center justify-center bg-base-200 p-4">
      <div className="fade-in w-full max-w-sm">
        <div className="surface-panel rounded-2xl p-6">
          {/* Brand */}
          <div className="flex flex-col items-center text-center">
            <BrandMark className="size-14 rounded-[22%] elevated" detail />
            <h2 className="mt-4 text-xl font-extrabold tracking-tight">Sign in to Nishan_teams</h2>
            <p className="mt-1 text-xs text-base-content/55">
              Use the fleet credentials issued by your dispatcher
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="username" className="label-caps block">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="Your fleet username"
                className="input input-bordered w-full rounded-lg text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="label-caps block">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Enter password"
                  className="input input-bordered w-full rounded-lg pr-10 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5
                    text-base-content/45 transition-colors hover:bg-base-200 hover:text-base-content"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <button
              disabled={isSigningIn}
              className="btn btn-primary w-full gap-2 rounded-lg font-semibold"
            >
              {isSigningIn ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <>
                  <LogIn className="size-4" /> Sign in
                </>
              )}
            </button>
          </form>
        </div>

        <p className="mt-4 text-center text-[11px] text-base-content/45">
          Trouble signing in? Contact your dispatch administrator.
        </p>
      </div>
    </div>
  );
};

export default SigninPage;
