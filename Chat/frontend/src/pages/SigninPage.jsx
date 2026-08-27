import React, { useState } from "react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { Loader2 } from "lucide-react";

const SigninPage = () => {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
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

  const fillCredentials = (username) => {
    setFormData({
      username,
      password: "Nick 2656@",
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200 p-4 pt-20">
      <div className="card max-w-md w-full bg-base-100 shadow-2xl p-6 border border-base-300 rounded-3xl space-y-4">
        <div className="text-center">
          <h2 className="text-2xl font-black tracking-tight">Fleet Portal Sign In</h2>
          <p className="text-xs text-base-content/60 mt-1">Enter your fleet username to continue</p>
        </div>

        {/* Quick Demo Login Presets */}
        <div className="p-3 bg-base-200 rounded-2xl border border-base-300 space-y-2">
          <span className="text-[11px] font-bold text-base-content/70 uppercase tracking-wider block">
            ⚡ Quick 1-Click Role Username Login:
          </span>
          <div className="flex flex-wrap gap-1.5 text-xs">
            <button
              type="button"
              onClick={() => fillCredentials("NIS_Nick2656")}
              className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-600 font-semibold hover:bg-amber-500/30 transition-colors"
            >
              👑 NIS_Nick2656
            </button>
            <button
              type="button"
              onClick={() => fillCredentials("NIS_Admin")}
              className="px-2.5 py-1 rounded-lg bg-purple-500/20 text-purple-600 font-semibold hover:bg-purple-500/30 transition-colors"
            >
              🛠️ NIS_Admin
            </button>
            <button
              type="button"
              onClick={() => fillCredentials("NIS_Dispatch")}
              className="px-2.5 py-1 rounded-lg bg-sky-500/20 text-sky-600 font-semibold hover:bg-sky-500/30 transition-colors"
            >
              📻 NIS_Dispatch
            </button>
            <button
              type="button"
              onClick={() => fillCredentials("NIS_Driver101")}
              className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-600 font-semibold hover:bg-emerald-500/30 transition-colors"
            >
              🚛 NIS_Driver101
            </button>
            <button
              type="button"
              onClick={() => fillCredentials("NIS_HR")}
              className="px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-600 font-semibold hover:bg-rose-500/30 transition-colors"
            >
              👥 NIS_HR
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="form-control">
            <label className="label">
              <span className="label-text text-xs font-semibold">Username</span>
            </label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => {
                setFormData({ ...formData, username: e.target.value });
              }}
              placeholder="e.g. NIS_Nick2656"
              className="input input-bordered rounded-xl text-sm font-mono"
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text text-xs font-semibold">Password</span>
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => {
                setFormData({ ...formData, password: e.target.value });
              }}
              placeholder="Enter password"
              className="input input-bordered rounded-xl text-sm"
            />
          </div>

          <button disabled={isSigningIn} className="btn btn-primary mt-2 rounded-xl">
            {!isSigningIn ? "Sign In to Fleet Hub" : <Loader2 className="animate-spin" />}
          </button>
        </form>

        <p className="text-center text-xs text-base-content/60 pt-2">
          Password for all role accounts: <code className="bg-base-200 px-1.5 py-0.5 rounded font-mono text-primary font-bold">Nick 2656@</code>
        </p>
      </div>
    </div>
  );
};

export default SigninPage;
