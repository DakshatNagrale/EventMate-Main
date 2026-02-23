import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaRegEyeSlash, FaRegEye } from "react-icons/fa6";
import api from "../lib/api";
import { storeAuth } from "../lib/auth";
import SummaryApi from "../common/SummaryApi";

export default function Login() {
  const navigate = useNavigate();
  const [data, setData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setData((prev) => ({
      ...prev,
      [name]: value.trimStart(),
    }));
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!data.email || !data.password) {
      setErrors({
        email: !data.email ? "Email is required" : "",
        password: !data.password ? "Password is required" : "",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await api({ ...SummaryApi.login, data });
      const { accessToken, refreshToken, role, token, user } = response.data || {};
      const finalAccessToken = accessToken || token;
      if (!finalAccessToken) {
        throw new Error("Login failed. Missing access token.");
      }

      storeAuth({ accessToken: finalAccessToken, refreshToken, user: user || { role } });

      let profileUser = user || null;
      try {
        if (!profileUser) {
          const profileResponse = await api({ ...SummaryApi.get_profile });
          profileUser = profileResponse.data?.user || null;
        }
        if (profileUser) storeAuth({ user: profileUser });
      } catch {
        profileUser = null;
      }

      const dashboardRoutes = {
        MAIN_ADMIN: "/admin-dashboard",
        ORGANIZER: "/organizer-dashboard",
        STUDENT_COORDINATOR: "/coordinator-dashboard",
        STUDENT: "/student-dashboard",
      };

      const currentRole = profileUser?.role || role || user?.role;
      navigate(dashboardRoutes[currentRole] || "/student-dashboard", { replace: true });
    } catch (error) {
      setErrors({ submit: error.response?.data?.message || error.message || "Login failed. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  const isValid = Object.values(data).every((el) => el);

  return (
    <section className="login-font relative min-h-screen overflow-hidden bg-gradient-to-br from-gray-50 via-indigo-50 to-purple-50 text-slate-900">
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(circle at top, rgba(99,102,241,0.18), transparent 55%), radial-gradient(circle at 20% 20%, rgba(168,85,247,0.2), transparent 40%), radial-gradient(circle at 80% 10%, rgba(236,72,153,0.16), transparent 45%)" }} />
        <div className="absolute inset-0 bg-[radial-gradient(#0f172a_0.5px,transparent_0.5px)] opacity-[0.08] [background-size:22px_22px]" />
      </div>

      <div className="pointer-events-none absolute -top-24 left-10 h-72 w-72 rounded-full bg-indigo-300/30 blur-3xl float-slow" />
      <div className="pointer-events-none absolute top-10 right-10 h-80 w-80 rounded-full bg-purple-300/30 blur-3xl float-medium" />
      <div className="pointer-events-none absolute bottom-10 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-pink-300/20 blur-3xl float-fast" />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center gap-12 px-6 py-16 lg:flex-row lg:items-stretch">
        <div className="flex w-full flex-col justify-center gap-6 lg:w-[45%]">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/70 bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-600 shadow-sm">
            EventMate
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />
          </div>
          <h1 className="text-4xl font-extrabold leading-tight sm:text-5xl">
            Welcome back to the
            <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent"> EventMate</span>
            {" "}workspace.
          </h1>
          <p className="text-lg text-slate-600">
            Sign in to access events, manage registrations, and unlock your personalized campus experience.
          </p>
          <div className="mt-4 grid gap-4">
            {[
              { title: "Real-time updates", desc: "Stay synced with live event status and announcements." },
              { title: "Role-based access", desc: "Admins, organizers, and students see exactly what they need." },
              { title: "Secure sessions", desc: "Your login is protected with JWT-based authentication." },
            ].map((item) => (
              <div key={item.title} className="glass-card flex items-start gap-4 rounded-2xl border border-white/60 bg-white/70 p-4 shadow-sm">
                <div className="mt-1 h-2.5 w-2.5 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500" />
                <div>
                  <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                  <p className="text-sm text-slate-600">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="w-full max-w-md lg:w-[45%]">
          <div className="animate-border rounded-[28px] p-[1px]">
            <div className="relative rounded-[28px] bg-white/90 px-8 py-10 shadow-xl backdrop-blur-xl">
              <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-emerald-200/40 blur-2xl" />
              <div className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-cyan-200/40 blur-2xl" />

              <div className="relative z-10">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">Sign in</p>
                <h2 className="mt-2 text-3xl font-bold text-slate-900">Access your dashboard</h2>
                <p className="mt-2 text-sm text-slate-500">Use your EventMate credentials below.</p>
              </div>

              <form className="relative z-10 mt-8 grid gap-5" onSubmit={handleSubmit} autoComplete="on">
                <div className="grid gap-2">
                  <label htmlFor="email" className="text-sm font-medium text-slate-700">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    autoComplete="email"
                    autoFocus
                    placeholder="you@college.edu"
                    className="w-full rounded-xl border border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200"
                    value={data.email}
                    onChange={handleChange}
                  />
                  {errors.email && <p className="text-sm text-red-600">{errors.email}</p>}
                </div>

                <div className="grid gap-2">
                  <label htmlFor="password" className="text-sm font-medium text-slate-700">
                    Password
                  </label>
                  <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white/80 px-4 py-3 text-sm transition focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-200">
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      name="password"
                      autoComplete="current-password"
                      placeholder="Enter your password"
                      className="w-full bg-transparent text-slate-900 outline-none"
                      value={data.password}
                      onChange={handleChange}
                    />
                    <button
                      type="button"
                      className="text-slate-500 transition hover:text-slate-900"
                      onClick={() => setShowPassword((prev) => !prev)}
                    >
                      {showPassword ? <FaRegEye /> : <FaRegEyeSlash />}
                    </button>
                  </div>

                  <Link to="/forgot-password" className="ml-auto text-xs font-medium text-indigo-600 hover:text-indigo-700">
                    Forgot password?
                  </Link>
                </div>

                {errors.submit && (
                  <p className="text-sm text-red-600 text-center bg-red-50 py-2 rounded-lg">
                    {errors.submit}
                  </p>
                )}

                <button
                  disabled={!isValid || isLoading}
                  className={`relative flex w-full items-center justify-center overflow-hidden rounded-xl py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white transition ${
                    isValid && !isLoading
                      ? "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 shadow-lg shadow-indigo-200/60 hover:translate-y-[-1px]"
                      : "bg-gray-400 cursor-not-allowed"
                  }`}
                >
                  <span className="relative z-10">{isLoading ? "Logging in..." : "Login"}</span>
                  <span className="absolute inset-0 opacity-0 transition group-hover:opacity-100 login-sheen" />
                </button>
              </form>

              <p className="relative z-10 mt-6 text-center text-sm text-slate-600">
                Do not have an account?
                <Link to="/signup" className="ml-1 font-semibold text-indigo-600 hover:underline">
                  Register
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @import url("https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&display=swap");
        .login-font { font-family: "Sora", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; }
        .animate-border {
          background: linear-gradient(120deg, rgba(99,102,241,0.5), rgba(168,85,247,0.5), rgba(236,72,153,0.45));
          background-size: 200% 200%;
          animation: borderShift 8s ease infinite;
        }
        .login-sheen {
          background: linear-gradient(120deg, transparent, rgba(255,255,255,0.55), transparent);
          background-size: 200% 100%;
          animation: sheen 3.5s ease infinite;
        }
        .float-slow { animation: float 16s ease-in-out infinite; }
        .float-medium { animation: float 12s ease-in-out infinite; }
        .float-fast { animation: float 10s ease-in-out infinite; }
        @keyframes borderShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes sheen {
          0% { background-position: 0% 0%; opacity: 0.2; }
          50% { background-position: 100% 0%; opacity: 0.6; }
          100% { background-position: 0% 0%; opacity: 0.2; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          50% { transform: translateY(-18px) translateX(10px); }
        }
      `}</style>
    </section>
  );
}
