"use client";

import { motion } from "framer-motion";
import { ArrowRight, Car, Zap, Shield, TrendingUp } from "lucide-react";
import Link from "next/link";
import Nav from "@/shared/components/Nav";
import Footer from "@/shared/components/Footer";
import { VEHICLE_OPTIONS } from "@/lib/vehicleConfig";
import { VEHICLE_SVG_ICONS } from "@/shared/components/VehicleIcons";

const FLEET_CATEGORIES = [
  {
    id: "bike",
    name: VEHICLE_OPTIONS.bike.label,
    description: VEHICLE_OPTIONS.bike.tagline,
    price: "Starting from ₹8/km",
    Icon: VEHICLE_SVG_ICONS.bike,
    capacity: "1 Passenger",
  },
  {
    id: "scooty",
    name: VEHICLE_OPTIONS.scooty.label,
    description: VEHICLE_OPTIONS.scooty.tagline,
    price: "Starting from ₹7/km",
    Icon: VEHICLE_SVG_ICONS.scooty,
    capacity: "1 Passenger",
  },
  {
    id: "auto",
    name: VEHICLE_OPTIONS.auto.label,
    description: VEHICLE_OPTIONS.auto.tagline,
    price: "Starting from ₹11.5/km",
    Icon: VEHICLE_SVG_ICONS.auto,
    capacity: "3 Passengers",
  },
  {
    id: "mini",
    name: VEHICLE_OPTIONS.mini.label,
    description: VEHICLE_OPTIONS.mini.tagline,
    price: "Starting from ₹13.5/km",
    Icon: VEHICLE_SVG_ICONS.mini,
    capacity: "4 Passengers (AC)",
  },
  {
    id: "car",
    name: VEHICLE_OPTIONS.car.label,
    description: VEHICLE_OPTIONS.car.tagline,
    price: "Starting from ₹16.5/km",
    Icon: VEHICLE_SVG_ICONS.car,
    capacity: "4 Passengers (Sedan)",
  },
  {
    id: "priority",
    name: VEHICLE_OPTIONS.priority.label,
    description: VEHICLE_OPTIONS.priority.tagline,
    price: "Starting from ₹21/km",
    Icon: VEHICLE_SVG_ICONS.priority,
    capacity: "6 Passengers (SUV)",
  },
  {
    id: "loading",
    name: VEHICLE_OPTIONS.loading.label,
    description: VEHICLE_OPTIONS.loading.tagline,
    price: "Starting from ₹20/km",
    Icon: VEHICLE_SVG_ICONS.loading,
    capacity: "Up to 500 kg Cargo",
  },
  {
    id: "truck",
    name: VEHICLE_OPTIONS.truck.label,
    description: VEHICLE_OPTIONS.truck.tagline,
    price: "Starting from ₹35/km",
    Icon: VEHICLE_SVG_ICONS.truck,
    capacity: "Up to 2,000 kg Freight",
  },
];

export default function FleetPage() {
  const features = [
    {
      icon: Car,
      title: "Diverse Vehicle Options",
      description: "Choose from scooty, bikes, autos, compact cabs, premium SUVs, and freight trucks",
    },
    {
      icon: Zap,
      title: "Quick Booking",
      description: "Reserve your vehicle in seconds with our easy-to-use platform",
    },
    {
      icon: Shield,
      title: "Safety First",
      description: "All vehicles are inspected and verified for your safety",
    },
    {
      icon: TrendingUp,
      title: "Affordable Rates",
      description: "Competitive pricing that fits your budget",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-black text-white justify-between">
      <Nav />
      <div className="flex-1 pt-40">
        {/* Hero Section */}
        <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-6xl mx-auto px-4 mb-20"
      >
        <h1 className="text-5xl md:text-6xl font-bold mb-6">
          Our Fleet
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl">
          Explore our wide range of vehicles designed to meet every transportation need. From quick city solo rides to heavy commercial freight, we have got you covered.
        </p>
      </motion.div>

      {/* Features Grid */}
      <div className="max-w-6xl mx-auto px-4 mb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
                className="bg-white/5 border border-white/10 rounded-2xl p-8 hover:border-white/20 transition"
              >
                <Icon className="w-12 h-12 mb-4 text-white" />
                <h3 className="text-2xl font-bold mb-3">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Vehicle Categories */}
      <div className="max-w-6xl mx-auto px-4 mb-20">
        <h2 className="text-4xl font-bold mb-12">Vehicle Categories</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {FLEET_CATEGORIES.map((category, idx) => {
            const Icon = category.Icon;
            return (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: idx * 0.05 }}
                className="bg-gradient-to-br from-white/10 to-white/5 border border-white/10 rounded-2xl p-6 flex flex-col justify-between group hover:border-white/30 transition select-none"
              >
                <div>
                  <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mb-4 p-2">
                    <Icon size={40} className="w-full h-full object-contain" />
                  </div>
                  <h3 className="text-xl font-bold mb-1 text-white">{category.name}</h3>
                  <p className="text-[11px] font-bold text-amber-400 mb-2 uppercase tracking-wider">{category.capacity}</p>
                  <p className="text-gray-400 text-xs mb-4 leading-relaxed">{category.description}</p>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                  <p className="text-white text-xs font-semibold">{category.price}</p>
                  <Link
                    href={`/book?vehicle=${category.id}&fresh=true`}
                    className="text-[11px] font-bold text-zinc-300 group-hover:text-white transition flex items-center gap-1"
                  >
                    Book <ArrowRight size={12} />
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="max-w-6xl mx-auto px-4 py-20 text-center"
      >
        <h2 className="text-4xl font-bold mb-6">Ready to ride?</h2>
        <Link
          href="/book?fresh=true"
          className="inline-block px-8 py-4 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition"
        >
          Book Now
        </Link>
      </motion.div>
      </div>
      <Footer />
    </div>
  );
}
