// data.js
// This file contains all the content for your portfolio.
// You can easily edit this file to update your website without touching the HTML.

const portfolioData = {
  profile: {
    name: "Anshul Chandra",
    role: "Expert Web Developer & Full Stack Engineer",
    description: "Hi, I'm Anshul, a professional web developer specializing in highly dynamic and responsive web applications. If you are looking to hire an expert freelance web developer, let's turn your vision into reality.",
    image: "profile.jpg" // We copied your profile picture here
  },
  education: [
    {
      degree: "Bachelor of Technology in Computer Science",
      institution: "Your University Name",
      year: "2020 - 2024",
      details: "Focus on Full Stack Development, Data Structures, and Algorithms."
    },
    {
      degree: "High School Diploma",
      institution: "Your High School",
      year: "2018 - 2020",
      details: "Major in Science and Mathematics."
    }
  ],
  projects: [
    {
      title: "E-Commerce Platform",
      description: "A full-featured e-commerce platform with payment gateway integration and dynamic inventory management.",
      image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=600&q=80",
      link: "#"
    },
    {
      title: "Worker Salary Management App",
      description: "A comprehensive application for tracking employee attendance, managing salaries, and automating payroll generation.",
      image: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80",
      link: "#"
    },
    {
      title: "Social Media Dashboard",
      description: "Analytics dashboard providing insights into social media engagement and follower growth metrics.",
      image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80",
      link: "#"
    }
  ],
  plans: {
    basic: {
      name: "Basic",
      price: 5000, // Example base price in rupees
      features: [
        "Responsive Single Page Website",
        "Basic SEO Setup",
        "Contact Form Integration",
        "5 Updates Included",
        "Standard Delivery"
      ]
    },
    standard: {
      name: "Standard",
      price: 15000,
      features: [
        "Multi-page Website (up to 5 pages)",
        "Advanced SEO & Analytics",
        "CMS Integration",
        "5 Updates Included",
        "Priority Support & Fast Delivery"
      ]
    },
    premium: {
      name: "Premium",
      price: 35000,
      features: [
        "Custom Full-Stack Web Application",
        "E-commerce & Payment Setup",
        "Database Architecture",
        "Lifetime Free Updates",
        "Dedicated Support"
      ],
      isPopular: true
    }
  },
  payment: {
    upiId: "9305727780@ptyes", // Real UPI ID connected
    payeeName: "Anshul Chandra",
    processingFee: 20
  }
};
