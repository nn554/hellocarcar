import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "HelloCarCar",
    short_name: "HelloCarCar",
    description: "Vehicle procurement decision platform",
    start_url: "/dz/ar",
    display: "standalone",
    background_color: "#f6f8f3",
    theme_color: "#133a36"
  };
}
