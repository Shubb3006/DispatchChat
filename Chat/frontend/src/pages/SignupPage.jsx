import React, { useState } from "react";
import toast from "react-hot-toast";
import { useAuthStore } from "../store/useAuthStore";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";

const SignupPage = () => {
  const { signup, isSigningUp } = useAuthStore();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
  });
  const validateform = () => {
    if (!formData.email.trim()) {
      toast.error("Email is Required");
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      toast.error("Invalid Email Format");
      return false;
    }
    if (!formData.password.trim()) {
      toast.error("Password is Required");
      return false;
    }
    if (formData.password.trim().length < 6) {
      toast.error("Password must be of min 6 characters");
      return false;
    }

    return true;
  };
  function handleSubmit(e) {
    e.preventDefault();
    const success = validateform();
    if (success) signup(formData);
  }
  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200 pt-20">
      <div className="card w-96 bg-base-100 shadow-xl p-6">
        <h2 className="text-2xl font-bold text-center mb-4">Sign Up</h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text">Email</span>
            </label>
            <input
              type="text"
              value={formData.email}
              onChange={(e) => {
                setFormData({ ...formData, email: e.target.value });
              }}
              placeholder="Enter your email"
              className="input input-bordered"
            />
          </div>
          <div className="form-control">
            <label className="label">
              <span className="label-text">Name</span>
            </label>
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) => {
                setFormData({ ...formData, fullName: e.target.value });
              }}
              placeholder="Enter your name"
              className="input input-bordered"
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Password</span>
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => {
                setFormData({ ...formData, password: e.target.value });
              }}
              placeholder="Enter your password"
              className="input input-bordered"
            />
          </div>

          <button disabled={isSigningUp} className="btn btn-primary mt-2">
            {!isSigningUp ? "Sign Up" : <Loader2 className="animate-spin"/>}
          </button>
        </form>
        <p className="mt-4 text-center text-sm">
          Aleady have an account?{" "}
          <Link
            to="/signin"
            className="text-primary font-semibold hover:underline"
          >
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SignupPage;
