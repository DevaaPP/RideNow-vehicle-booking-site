"use client";

import { motion } from "framer-motion";
import { Mail, Phone, MapPin, Send, CheckCircle2, Clock, MessageSquareQuote } from "lucide-react";
import { useState } from "react";
import Nav from "@/shared/components/Nav";
import Footer from "@/shared/components/Footer";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Form submission simulation / API connect
      setSubmitted(true);
      setFormData({ name: "", email: "", subject: "", message: "" });
      setTimeout(() => setSubmitted(false), 5000);
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setLoading(false);
    }
  };

  const contactInfo = [
    {
      icon: Phone,
      title: "Direct Support Hotline",
      details: "+91 800-JATRI-NOW",
      subtext: "24×7 Rapid Assistance for active rides",
      link: "tel:+918005287466",
    },
    {
      icon: Mail,
      title: "Grievance & Support Email",
      details: "support@ridenow.com",
      subtext: "Response within 4 business hours",
      link: "mailto:support@ridenow.com",
    },
    {
      icon: MapPin,
      title: "Guwahati Operations Centre",
      details: "GS Road, Christian Basti, Guwahati",
      subtext: "Assam 781005, India",
      link: "#",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F1E5] text-[#10251C] justify-between">
      <Nav />

      <main className="flex-1 pt-28 sm:pt-36 pb-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* ================= INTRO HEADER ================= */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-12 sm:mb-16 max-w-2xl"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E5EBDD] text-[#123D32] border border-[#cdd6c3] text-xs font-bold uppercase tracking-wider mb-3">
              <MessageSquareQuote size={13} className="text-[#B83A24]" />
              <span>Assam Dispatch & Care Desk</span>
            </div>
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-[#10251C] tracking-tight mb-4">
              Get in Touch with Us
            </h1>
            <p className="text-[#696B64] text-base sm:text-lg leading-relaxed">
              Have questions regarding booking, fleet onboarding, enterprise packages, or ride safety? Our dedicated local Guwahati support team is here to assist.
            </p>
          </motion.div>

          {/* ================= CONTACT CARDS ================= */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 mb-12 sm:mb-16">
            {contactInfo.map((info, idx) => {
              const Icon = info.icon;
              return (
                <motion.a
                  key={idx}
                  href={info.link}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: idx * 0.08 }}
                  className="bg-[#FAF7F0] border border-[#DED7CA] rounded-[12px] p-6 shadow-2xs hover:border-[#123D32]/50 hover:shadow-xs transition duration-200 block"
                >
                  <div className="w-11 h-11 rounded-[8px] bg-[#E5EBDD] text-[#123D32] flex items-center justify-center mb-4">
                    <Icon size={22} />
                  </div>
                  <h3 className="font-bold text-base text-[#10251C] mb-1">{info.title}</h3>
                  <p className="font-semibold text-sm text-[#123D32] mb-1">{info.details}</p>
                  <p className="text-xs text-[#696B64]">{info.subtext}</p>
                </motion.a>
              );
            })}
          </div>

          {/* ================= FORM & DETAILS ================= */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="lg:col-span-7 bg-[#FAF7F0] border border-[#DED7CA] rounded-[14px] p-6 sm:p-8 shadow-xs"
            >
              <h2 className="font-serif text-2xl text-[#10251C] mb-2">Send us a Message</h2>
              <p className="text-xs sm:text-sm text-[#696B64] mb-6">
                Fill in your details and message. We will respond via email or telephone promptly.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#10251C] mb-1.5">
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="e.g. Partha Pratim"
                      required
                      className="w-full px-3.5 py-2.5 bg-white border border-[#DED7CA] rounded-[8px] text-[#10251C] placeholder-[#696B64]/60 text-sm focus:outline-none focus:border-[#123D32] focus:ring-1 focus:ring-[#123D32] transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#10251C] mb-1.5">
                      Email Address
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="you@example.com"
                      required
                      className="w-full px-3.5 py-2.5 bg-white border border-[#DED7CA] rounded-[8px] text-[#10251C] placeholder-[#696B64]/60 text-sm focus:outline-none focus:border-[#123D32] focus:ring-1 focus:ring-[#123D32] transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#10251C] mb-1.5">
                    Subject / Concern
                  </label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    placeholder="e.g. Driver Partner Inquiry, Trip Question"
                    required
                    className="w-full px-3.5 py-2.5 bg-white border border-[#DED7CA] rounded-[8px] text-[#10251C] placeholder-[#696B64]/60 text-sm focus:outline-none focus:border-[#123D32] focus:ring-1 focus:ring-[#123D32] transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#10251C] mb-1.5">
                    Detailed Message
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Provide your ride reference or question details..."
                    rows={4}
                    required
                    className="w-full px-3.5 py-2.5 bg-white border border-[#DED7CA] rounded-[8px] text-[#10251C] placeholder-[#696B64]/60 text-sm focus:outline-none focus:border-[#123D32] focus:ring-1 focus:ring-[#123D32] transition resize-none"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-[#123D32] hover:bg-[#0D3027] text-white font-bold rounded-[8px] transition active:scale-95 shadow-xs disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
                >
                  <Send size={16} />
                  <span>{loading ? "Submitting Request..." : "Send Message"}</span>
                </button>

                {submitted && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-[8px] text-emerald-900 text-xs font-semibold flex items-center gap-2"
                  >
                    <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0" />
                    <span>Message received successfully. Our support desk will reach out shortly.</span>
                  </motion.div>
                )}
              </form>
            </motion.div>

            {/* Info & Operational Desk Section */}
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="lg:col-span-5 space-y-6"
            >
              <div className="bg-[#FAF7F0] border border-[#DED7CA] rounded-[14px] p-6 sm:p-7 shadow-xs">
                <div className="flex items-center gap-2.5 text-[#123D32] mb-4">
                  <Clock size={20} />
                  <h3 className="font-bold text-base text-[#10251C]">Operating Hours</h3>
                </div>

                <div className="space-y-3 text-xs sm:text-sm divide-y divide-[#DED7CA]/60">
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-[#696B64]">In-Ride GPS Telemetry & SOS</span>
                    <span className="font-bold text-[#123D32]">24 Hours / 7 Days</span>
                  </div>
                  <div className="flex justify-between items-center pt-3">
                    <span className="text-[#696B64]">Driver Onboarding Hub</span>
                    <span className="font-semibold text-[#10251C]">Mon - Sat: 9:00 AM - 6:00 PM</span>
                  </div>
                  <div className="flex justify-between items-center pt-3">
                    <span className="text-[#696B64]">Grievance Officer Office</span>
                    <span className="font-semibold text-[#10251C]">Mon - Fri: 10:00 AM - 5:00 PM</span>
                  </div>
                </div>
              </div>

              <div className="bg-[#FAF7F0] border border-[#DED7CA] rounded-[14px] p-6 sm:p-7 shadow-xs">
                <h3 className="font-serif text-xl text-[#10251C] mb-2">Our Commitment</h3>
                <p className="text-xs sm:text-sm text-[#696B64] leading-relaxed mb-4">
                  Jaatri is dedicated to ethical mobility, fair driver earnings, and passenger transparency across all 35 districts of Assam.
                </p>
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#B83A24]">
                  <span>Jaatri Mobility Technologies Private Limited</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
