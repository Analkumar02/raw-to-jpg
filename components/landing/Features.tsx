"use client";
import {
  Zap,
  Shield,
  Layers,
  Download,
  Globe,
  MonitorCheck,
  FolderArchive,
  Eye,
} from "lucide-react";

const FEATURES = [
  {
    icon: Zap,
    title: "Lightning Fast",
    description:
      "Parallel conversion workers process multiple RAW files simultaneously with intelligent queue management.",
    color: "from-amber-500/20 to-orange-500/10",
    border: "border-amber-500/20",
    iconColor: "text-amber-400",
  },
  {
    icon: Layers,
    title: "Batch Processing",
    description:
      "Upload and convert hundreds of images in one session. Drag entire folders, manage the queue with ease.",
    color: "from-violet-500/20 to-purple-500/10",
    border: "border-violet-500/20",
    iconColor: "text-violet-400",
  },
  {
    icon: Globe,
    title: "All RAW Formats",
    description:
      "Canon CR2/CR3, Nikon NEF, Sony ARW, Fujifilm RAF, Olympus ORF, Panasonic RW2, Adobe DNG, and 15+ more.",
    color: "from-cyan-500/20 to-teal-500/10",
    border: "border-cyan-500/20",
    iconColor: "text-cyan-400",
  },
  {
    icon: MonitorCheck,
    title: "Max Quality Output",
    description:
      "JPEG at 100% quality, 4:4:4 chroma subsampling. Original resolution, aspect ratio, and color profile preserved.",
    color: "from-emerald-500/20 to-green-500/10",
    border: "border-emerald-500/20",
    iconColor: "text-emerald-400",
  },
  {
    icon: FolderArchive,
    title: "ZIP Download",
    description:
      "Download all converted images as a single ZIP archive with one click. Or download individually.",
    color: "from-fuchsia-500/20 to-pink-500/10",
    border: "border-fuchsia-500/20",
    iconColor: "text-fuchsia-400",
  },
  {
    icon: Shield,
    title: "Privacy First",
    description:
      "Files are processed on the server and auto-deleted after 1 hour. Nothing is stored permanently.",
    color: "from-rose-500/20 to-red-500/10",
    border: "border-rose-500/20",
    iconColor: "text-rose-400",
  },
  {
    icon: Eye,
    title: "Live Previews",
    description:
      "See thumbnail previews of converted images instantly. Click to open a full-screen viewer with zoom.",
    color: "from-sky-500/20 to-blue-500/10",
    border: "border-sky-500/20",
    iconColor: "text-sky-400",
  },
  {
    icon: Download,
    title: "No Install Required",
    description:
      "Works entirely in the browser with a server pipeline. No software to install, no plugins needed.",
    color: "from-indigo-500/20 to-violet-500/10",
    border: "border-indigo-500/20",
    iconColor: "text-indigo-400",
  },
];

export function Features() {
  return (
    <section id="features" className="relative px-4 py-24">
      <div className="max-w-6xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-4">
            Everything you need to
            <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
              {" "}convert RAW files
            </span>
          </h2>
          <p className="text-white/40 text-lg max-w-2xl mx-auto">
            A professional-grade conversion pipeline in your browser. No compromises.
          </p>
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map(({ icon: Icon, title, description, color, border, iconColor }, i) => (
            <div
              key={title}
              className={`group relative flex flex-col gap-4 p-6 rounded-2xl bg-gradient-to-br ${color} border ${border} hover:scale-[1.02] hover:shadow-lg transition-all duration-300`}
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div
                className={`flex items-center justify-center w-11 h-11 rounded-xl bg-white/5 ${iconColor} group-hover:scale-110 transition-transform duration-300`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-white font-bold text-base mb-1">{title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
