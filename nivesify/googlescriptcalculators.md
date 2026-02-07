<!DOCTYPE html>
<html>
<head>
  <base target="_top">
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
  <title>Your Financial Dream Weaver</title>

  <!-- Google Fonts for a modern look -->
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&family=Open+Sans:400;600&display=swap" rel="stylesheet">
  <!-- Font Awesome for Icons -->
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css">

  <style>
    /* New Vibrant Color Palette */
    :root {
      --primary-color: #4CAF50; /* A vibrant green, often associated with growth and money */
      --primary-dark: #388E3C;
      --accent-color: #2196F3; /* A bright blue for highlights and interactive elements */
      --accent-dark: #1976D2;
      --background-light: #E8F5E9; /* Very light green for subtle backgrounds */
      --text-dark: #2C3E50; /* Dark blue-grey for main text */
      --text-medium: #555;
      --text-light: #F8F8F8;
      --shadow-color: rgba(0, 0, 0, 0.15);
      --border-light: #B2DFDB;
      --card-bg: #FFFFFF;
      --card-hover-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
    }

    /* Global Styles */
    body {
      font-family: 'Open Sans', sans-serif;
      margin: 0;
      padding: 0;
      /* Updated: Dynamic gradient background for the body */
      background: linear-gradient(45deg, #e0f7fa, #e8f5e9, #f0f4c3, #fffde7);
      background-size: 400% 400%;
      animation: gradientBackground 15s ease infinite;
      color: var(--text-medium);
      line-height: 1.6;
      display: flex;
      justify-content: center;
      align-items: flex-start;
      min-height: 100vh;
      padding: 30px 0;
    }

    @keyframes gradientBackground {
        0% {background-position: 0% 50%;}
        50% {background-position: 100% 50%;}
        100% {background-position: 0% 50;}
    }
.container {
      background-color: #fff;
      border-radius: 20px;
      box-shadow: 0 20px 40px var(--shadow-color);
      padding: 0; /* Sections inside will have their own padding */
      width: 90%;
      max-width: 1200px; /* THIS IS THE KEY CHANGE FOR WIDTH CONSISTENCY */
      text-align: center;
      box-sizing: border-box;
      overflow: hidden;
      flex-grow: 1;
      display: flex;
      flex-direction: column;
      margin: 30px auto; /* Center the container with margin */
    }
  



    /* Tab Navigation Bar Styles */
    .tab-navigation {
        display: flex;
        justify-content: center;
        margin-bottom: 30px;
        background-color: var(--background-light);
        border-radius: 15px;
        padding: 10px;
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
        flex-wrap: wrap; /* Allow tabs to wrap on smaller screens */
        gap: 10px; /* Space between tabs */
    }

    .tab-button {
        flex: 1; /* Allow tabs to grow and shrink */
        min-width: 150px; /* Minimum width for tabs */
        padding: 15px 25px;
        background-color: var(--card-bg);
        border: 2px solid var(--border-light);
        border-radius: 10px;
        font-family: 'Montserrat', sans-serif;
        font-size: 1.2em;
        font-weight: 600;
        color: var(--text-dark);
        cursor: pointer;
        transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease, transform 0.2s ease, box-shadow 0.3s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        text-decoration: none; /* In case it's an anchor tag */
    }

    .tab-button:hover {
        background-color: var(--background-light);
        border-color: var(--accent-color);
        transform: translateY(-2px);
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
    }

    .tab-button.active {
        background-color: var(--primary-color);
        color: var(--text-light);
        border-color: var(--primary-dark);
        box-shadow: 0 5px 20px rgba(0, 128, 0, 0.4);
        transform: translateY(-3px);
    }

    .tab-button.active i {
        color: var(--text-light);
    }

    .tab-button i {
        font-size: 1.2em;
        color: var(--accent-color);
        transition: color 0.3s ease;
    }

    /* Sub-Tab Navigation Bar Styles */
    .sub-tab-navigation {
        display: flex;
        justify-content: center;
        margin-top: 30px; /* Space above sub-tabs */
        margin-bottom: 30px;
        background-color: var(--card-bg); /* Lighter background for sub-tabs */
        border-radius: 10px;
        padding: 8px;
        box-shadow: 0 3px 10px rgba(0, 0, 0, 0.05);
        flex-wrap: wrap;
        gap: 8px; /* Smaller gap for sub-tabs */
    }

    .sub-tab-button {
        flex: 1;
        min-width: 120px; /* Smaller min-width for sub-tabs */
        padding: 10px 15px;
        background-color: #F0F4F7; /* Very light grey-blue */
        border: 1px solid var(--border-light);
        border-radius: 8px;
        font-family: 'Open Sans', sans-serif;
        font-size: 0.95em; /* Smaller font size */
        font-weight: 600;
        color: var(--text-medium);
        cursor: pointer;
        transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease, transform 0.1s ease, box-shadow 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        text-decoration: none;
    }

    .sub-tab-button:hover {
        background-color: var(--background-light);
        border-color: var(--primary-color);
        transform: translateY(-1px);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    }

    .sub-tab-button.active {
        background-color: var(--accent-color); /* Use accent color for active sub-tab */
        color: var(--text-light);
        border-color: var(--accent-dark);
        box-shadow: 0 3px 10px rgba(33, 150, 243, 0.3);
        transform: translateY(-2px);
    }

    .sub-tab-button.active i {
        color: var(--text-light);
    }

    .sub-tab-button i {
        font-size: 1em;
        color: var(--primary-color); /* Primary color for sub-tab icons */
        transition: color 0.2s ease;
    }


    /* Main Category Cards (now jump links) - HIDDEN as replaced by tabs */
    .story-cards-container {
        display: none; /* Hide the old category cards */
    }

    /* Full Page Sections for Categories - Differentiated Styles */
    .full-page-section {
        margin-top: 60px; /* More space between main sections */
        padding: 50px 30px; /* Consistent padding */
        border-radius: 20px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
        text-align: left;
        transition: background-color 0.5s ease; /* Smooth transition for background */
        display: none; /* Hidden by default, JavaScript will show */
    }

    #dreamPlanningSection {
        background-color: #f7fcf7; /* Very light green */
        border: 1px solid #d4edda; /* Greenish border */
    }

    #retirementSecuritySection {
        background-color: #f7fbff; /* Very light blue */
        border: 1px solid #d0e7f7; /* Bluish border */
    }

    #comprehensivePlanningSection {
        background-color: #fffdf7; /* Very light yellow/cream */
        border: 1px solid #fcf8e3; /* Yellowish border */
    }

    /* Calculator Specific Styles */
    .calculator-section {
      margin-top: 40px;
      background-color: #F8FCF8; /* Light green tint for calculator section */
      border-radius: 15px;
      padding: 35px;
      border: 1px solid var(--border-light);
      text-align: left;
      animation: fadeIn 0.8s ease-out forwards;
      display: none; /* Hidden by default, JavaScript will show */
    }
    .calculator-section.active {
        display: block; /* Only active calculator is shown */
    }


    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
    }

    h2 {
      font-family: 'Montserrat', sans-serif;
      font-size: 2.5em;
      margin-top: 0;
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 15px;
    }
    /* H2 colors specific to sections */
    #dreamPlanningSection h2 { color: var(--primary-dark); }
    #retirementSecuritySection h2 { color: var(--accent-dark); }
    #comprehensivePlanningSection h2 { color: #d68910; /* A warm orange-brown */ }


    h3 { /* For sub-sections like Advanced Retirement Planning, and output headers */
        font-family: 'Montserrat', sans-serif;
        font-size: 2em;
        margin-top: 40px;
        margin-bottom: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        border-bottom: 1px dashed var(--border-light);
        padding-bottom: 15px;
    }
    /* H3 colors specific to sections/sub-sections */
    #retirementSecuritySection h3 { color: var(--accent-dark); } /* Advanced Retirement Planning */
    .output-section h3 { /* Overrides for output section headers */
        color: var(--primary-color); /* Kept consistent with original output style */
    }

    h2 i {
        color: var(--accent-color);
        font-size: 1.2em;
    }
    h3 i { /* For sub-section headings */
        color: var(--accent-color);
    }
    .output-section h3 i { /* Overrides for output section icons */
        color: #FFC107; /* Kept consistent with original output style */
    }


    p.intro-text {
      font-size: 1.15em;
      margin-bottom: 25px;
      color: var(--text-medium);
      max-width: 700px;
      margin-left: auto;
      margin-right: auto;
    }

    .input-group {
      margin-bottom: 30px;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 15px;
      position: relative;
    }

    .input-group label {
      flex: 1 1 180px;
      display: flex;
      align-items: center;
      gap: 10px;
      font-weight: 600;
      color: var(--text-dark);
      font-size: 1.15em;
      text-align: left;
    }

    .input-group label i {
        color: var(--primary-color);
        font-size: 1.1em;
    }

    .input-controls {
        flex: 2 1 400px;
        display: flex;
        align-items: center;
        gap: 15px;
    }

    .input-group input[type="range"] {
      flex: 1;
      -webkit-appearance: none;
      height: 12px;
      background: var(--background-light);
      border-radius: 6px;
      outline: none;
      transition: background .2s;
    }

    .input-group input[type="range"]::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: var(--accent-color);
      cursor: grab;
      box-shadow: 0 3px 6px rgba(0, 123, 255, 0.4);
      border: 3px solid #fff;
      transition: background 0.2s, box-shadow 0.2s, transform 0.2s ease;
    }
    .input-group input[type="range"]::-webkit-slider-thumb:active {
        cursor: grabbing;
        transform: scale(1.1);
    }
    .input-group input[type="range"]::-webkit-slider-thumb:hover {
        transform: scale(1.05);
    }


    .input-group input[type="range"]::-moz-range-thumb {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: var(--accent-color);
      cursor: grab;
      box-shadow: 0 3px 6px rgba(0, 123, 255, 0.4);
      border: 3px solid #fff;
      transition: background 0.2s, box-shadow 0.2s, transform 0.2s ease;
    }
    .input-group input[type="range"]::-moz-range-thumb:active {
        cursor: grabbing;
        transform: scale(1.1);
    }
    .input-group input[type="range"]::-moz-range-thumb:hover {
        transform: scale(1.05);
    }

    .slider-value {
      font-weight: 700;
      color: var(--accent-dark);
      min-width: 140px;
      text-align: right;
      font-size: 1.15em;
    }

    .input-group input[type="number"],
    .input-group input[type="text"] { /* Added text type for lump sum withdrawals */
        width: 130px;
        padding: 12px;
        border: 1px solid var(--border-light);
        border-radius: 8px;
        font-size: 1.05em;
        text-align: right;
        transition: border-color 0.2s, box-shadow 0.2s;
    }
    .input-group input[type="number"]:focus,
    .input-group input[type="text"]:focus {
        border-color: var(--accent-color);
        box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.2);
        outline: none;
    }

    .input-group input[type="number"].percent-input {
        width: 90px;
    }

    button {
      background-color: var(--primary-color);
      color: var(--text-light);
      padding: 15px 35px;
      border: none;
      border-radius: 10px;
      font-size: 1.3em;
      cursor: pointer;
      transition: background-color 0.3s ease, transform 0.2s ease, box-shadow 0.3s ease;
      margin-top: 25px;
      font-family: 'Montserrat', sans-serif;
      font-weight: 600;
      box-shadow: 0 5px 15px rgba(0, 128, 0, 0.3);
    }
    button:hover {
        background-color: var(--primary-dark);
        transform: translateY(-3px);
        box-shadow: 0 8px 20px rgba(0, 128, 0, 0.4);
    }
    button:active {
        transform: translateY(0);
        box-shadow: 0 3px 10px rgba(0, 128, 0, 0.3);
    }

    .output-section {
      margin-top: 40px;
      padding: 30px;
      background-color: #FFFDE7; /* Very light yellow/gold for celebration */
      border-radius: 15px;
      border: 1px solid #FFECB3; /* Lighter gold border */
      display: none;
      position: relative;
      overflow: hidden;
    }

    .output-section h3 {
      font-family: 'Montserrat', sans-serif;
      color: var(--primary-color);
      font-size: 2.4em;
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 15px;
    }
    .output-section h3 i {
        color: #FFC107;
        font-size: 1.2em;
    }

    .output-value {
      font-size: 3.2em;
      font-weight: 700;
      color: var(--primary-dark);
      margin-bottom: 20px;
      word-break: break-word;
      animation: fadeInScale 0.8s ease-out forwards;
    }
    .output-row { /* For RSA calculator output */
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;
        padding: 5px 0;
        border-bottom: 1px dashed #eee;
    }
    .output-row:last-child {
        border-bottom: none;
    }
    .output-row p {
        margin: 0;
        font-size: 1.1em;
        color: var(--text-dark);
    }
    .output-row .output-value {
        font-size: 1.8em;
        margin-bottom: 0;
    }


    .output-message {
      font-size: 1.25em;
      color: var(--text-medium); /* Changed to medium for better contrast */
      margin-bottom: 25px;
      line-height: 1.5;
    }

    /* Chart styles */
    .chart-container {
      width: 100%;
      height: 450px;
      margin-top: 30px;
      background-color: #fff;
      border-radius: 10px;
      padding: 15px;
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
    }

    /* Responsive adjustments */
    @media (max-width: 768px) {
      body {
        padding: 15px 0;
      }
      .container {
        padding: 20px;
        width: 98%;
      }
      .hero-section {
        padding: 50px 15px;
        min-height: 280px;
      }
      .hero-content h1 {
        font-size: 2.8em;
      }
      .hero-content p {
        font-size: 1.1em;
      }
      .tab-navigation {
          flex-direction: column; /* Stack tabs vertically on small screens */
          gap: 5px;
          padding: 5px;
      }
      .tab-button {
          min-width: unset; /* Remove min-width */
          width: 100%; /* Full width */
          padding: 12px 15px;
          font-size: 1em;
      }
      .sub-tab-navigation {
          flex-direction: column;
          gap: 5px;
          padding: 5px;
      }
      .sub-tab-button {
          min-width: unset;
          width: 100%;
          padding: 10px 12px;
          font-size: 0.9em;
      }
      .story-cards-container {
          grid-template-columns: 1fr;
          gap: 20px;
      }
      .story-card {
          padding: 25px;
      }
      .story-card i {
          font-size: 3.5em;
      }
      .story-card h3 {
          font-size: 1.5em;
      }
      .story-card p {
          font-size: 0.95em;
      }
      .back-button-container { /* This will be removed, but keeping for reference */
          margin-bottom: 20px;
      }
      h2 {
        font-size: 2em;
        gap: 10px;
      }
      h2 i {
        font-size: 1em;
      }
      h3 { /* For sub-sections like Advanced Retirement Planning */
        font-size: 1.8em;
      }
      .input-group {
        flex-direction: column;
        align-items: flex-start;
        gap: 10px;
      }
      .input-group label {
          font-size: 1.05em;
      }
      .input-controls {
          flex-direction: column;
          width: 100%;
      }
      .input-group input[type="range"],
      .input-group input[type="number"],
      .input-group input[type="text"] {
          width: 100%;
      }
      .slider-value {
          text-align: left;
          margin-top: 5px;
          min-width: auto;
      }
      button {
          padding: 12px 25px;
          font-size: 1.15em;
      }
      .output-section h3 {
        font-size: 2em;
        gap: 10px;
      }
      .output-section h3 i {
        font-size: 1em;
      }
      .output-value {
        font-size: 2.5em;
      }
      .output-row .output-value {
        font-size: 1.5em; /* Smaller for mobile output rows */
      }
      .output-message {
        font-size: 1.1em;
      }
      .chart-container {
        height: 350px;
      }
    }
/* Footer Styling - Classy and Sober */
    .site-footer {
        width: 100%;
        max-width: 1000px; /* Match container max-width */
        margin-top: 60px; /* Increased space above the footer for separation */
        padding: 30px 20px; /* Slightly more padding */
        background-color: #F8F8F8; /* Very light grey for a clean, sober look */
        color: var(--text-dark); /* Darker text for better contrast on light background */
        font-family: 'Open Sans', sans-serif;
        font-size: 1.05em; /* Increased font size for readability */
        text-align: center;
        border-radius: 15px; /* Consistent rounded corners */
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05); /* Very subtle, softer shadow */
        border-top: 1px solid var(--border-light); /* Subtle top border for definition */
        box-sizing: border-box; /* Include padding in width */
    }

    .site-footer p {
        margin: 0; /* Remove default paragraph margins */
        line-height: 1.6; /* Slightly increased line height */
        opacity: 0.95; /* Almost full opacity for clarity */
        font-weight: 500; /* Slightly bolder for presence */
    }

    /* Responsive adjustments for footer */
    @media (max-width: 768px) {
        .site-footer {
            padding: 25px 15px;
            font-size: 0.95em; /* Adjusted for mobile readability */
            margin-top: 40px;
            border-radius: 10px;
        }
    }
    /* Confetti Effect (Pure CSS - for fun!) */
    .confetti {
        position: fixed; /* Changed to fixed so it falls over everything */
        width: 10px;
        height: 10px;
        background-color: var(--accent-color);
        border-radius: 50%;
        opacity: 0;
        animation: confetti-fall linear forwards;
    }
    .confetti:nth-child(2n) { background-color: var(--primary-color); }
    .confetti:nth-child(3n) { background-color: #FFC107; }
    .confetti:nth-child(4n) { background-color: #FF5722; }

    @keyframes confetti-fall {
        0% { transform: translate(var(--x), var(--y)) rotate(0deg); opacity: 1; }
        100% { transform: translate(var(--x-end), var(--y-end)) rotate(720deg); opacity: 0; }
    }

    /* Fade and Scale In Animation for output value */
    @keyframes fadeInScale {
        from {
            opacity: 0;
            transform: scale(0.8);
        }
        to {
            opacity: 1;
            transform: scale(1);
        }
    }
/* Hero Section - The Grand Entrance (Reduced Size & New Animations) */
    .hero-section {
      position: relative;
      overflow: hidden;
      padding: 60px 20px; /* Further reduced padding */
      /* Softer, elegant background gradient */
      background: linear-gradient(135deg, #F0F8F0 0%, #E0F7FA 100%);
      border-radius: 20px 20px 0 0; /* Match container top radius */
      color: var(--text-dark); /* Default text color for hero is now dark */
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1); /* Softer shadow */
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 380px; /* Further reduced min-height */
    }

    /* Animated background elements for the hero */
    .hero-bg-visuals {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        overflow: hidden;
        z-index: 0;
    }

    .hero-bg-visuals .icon-float {
        position: absolute;
        font-size: 8em; /* Adjusted icon size for smaller hero */
        color: rgba(0, 0, 0, 0.05); /* Very subtle dark icons */
        filter: blur(1px); /* Slightly less blur */
        animation: floatAndRotate 20s infinite ease-in-out;
        text-shadow: none; /* No text shadow for these subtle icons */
    }
    .hero-bg-visuals .icon-float:nth-child(1) { top: 10%; left: 5%; animation-delay: 0s; } /* Chart Line */
    .hero-bg-visuals .icon-float:nth-child(2) { top: 60%; right: 8%; animation-delay: 5s; } /* Piggy Bank */
    .hero-bg-visuals .icon-float:nth-child(3) { bottom: 5%; left: 30%; animation-delay: 10s; } /* Dollar/Rupee Sign */

    @keyframes floatAndRotate {
        0% { transform: translateY(0px) rotate(0deg); }
        50% { transform: translateY(-15px) rotate(5deg); } /* Less movement */
        100% { transform: translateY(0px) rotate(0deg); }
    }

    /* Sparkle/Flow Animation */
    .hero-bg-visuals .sparkle {
        position: absolute;
        font-size: 1.2em; /* Smaller, sparkling elements */
        color: rgba(var(--accent-color), 0.6); /* Subtle accent color sparkles */
        opacity: 0;
        animation: sparkleFlow 8s infinite linear;
        text-shadow: 0 0 3px rgba(33, 150, 243, 0.3); /* Softer shadow */
    }
    .hero-bg-visuals .sparkle:nth-child(4) { top: 20%; left: -10%; animation-delay: 0s; }
    .hero-bg-visuals .sparkle:nth-child(5) { top: 40%; left: -20%; animation-delay: 2s; }
    .hero-bg-visuals .sparkle:nth-child(6) { top: 60%; left: -30%; animation-delay: 4s; }
    .hero-bg-visuals .sparkle:nth-child(7) { top: 80%; left: -40%; animation-delay: 6s; }

    @keyframes sparkleFlow {
        0% { transform: translateX(0) translateY(0); opacity: 0; }
        10% { opacity: 0.7; } /* Slightly less opaque */
        90% { opacity: 0.7; }
        100% { transform: translateX(120vw) translateY(-20px); opacity: 0; }
    }


    .hero-content {
      position: relative;
      z-index: 1;
      max-width: 800px;
      margin: 0 auto;
      opacity: 0; /* Still hide hero content for its specific animation */
      transform: translateY(20px);
      animation: contentFadeIn 1.2s ease-out forwards;
      animation-delay: 0.5s;
    }

    .company-logo {
        max-width: 150px;
        height: auto;
        margin-bottom: 20px;
        /* Filter adjusted for lighter background */
        filter: drop-shadow(0 0 8px rgba(0,0,0,0.2));
    }

    .company-logo-fallback {
        justify-content: center;
        align-items: center;
        width: 150px;
        height: 50px;
        background-color: var(--primary-color);
        color: var(--text-light);
        font-family: 'Montserrat', sans-serif;
        font-weight: 700;
        font-size: 1.5em;
        border-radius: 10px;
        box-shadow: 0 0 10px rgba(0,0,0,0.3);
        margin: 0 auto 20px auto;
        text-align: center;
        padding: 5px;
        box-sizing: border-box;
        display: none;
    }

    .hero-content h1 {
      font-family: 'Montserrat', sans-serif;
      font-size: 3.5em; /* Further adjusted heading size */
      font-weight: 700;
      margin-bottom: 15px; /* Further adjusted margin */
      color: var(--primary-dark); /* Dark green for heading */
      text-shadow: none; /* Removed text shadow */
      line-height: 1.1;
    }

    .hero-content p {
      font-family: 'Open Sans', sans-serif;
      font-size: 1.3em; /* Further adjusted paragraph size */
      color: var(--text-medium); /* Medium dark for paragraph */
      margin-bottom: 0;
      line-height: 1.5;
    }

    /* Specific style for the "Back to Main Page" button on feature pages */
    .hero-section .cta-button.back-to-main {
        background-color: var(--primary-color); /* Use your vibrant primary green */
        box-shadow: 0 8px 20px rgba(76, 175, 80, 0.4); /* Green shadow for depth */
        color: var(--text-light);
        padding: 12px 25px; /* Smaller padding for consistency with other buttons */
        border-radius: 8px; /* Consistent rounded corners */
        font-size: 1.0em; /* Consistent font size */
        margin-top: 25px; /* Space above button */
        display: inline-flex; /* Align icon and text */
        align-items: center;
        gap: 8px;
    }

    .hero-section .cta-button.back-to-main:hover {
        background-color: var(--primary-dark); /* Darker green on hover */
        box-shadow: 0 12px 25px rgba(56, 142, 60, 0.5); /* Stronger green shadow on hover */
        transform: translateY(-3px); /* Consistent lift on hover */
    }

    @keyframes contentFadeIn {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
    }
  </style>
</head>
<body>

  <div class="container">
    <div class="hero-section">
      <!-- Animated background visuals: Thematic icons and flowing sparkles -->
      <div class="hero-bg-visuals">
          <i class="fas fa-chart-line icon-float"></i>
          <i class="fas fa-piggy-bank icon-float"></i>
          <i class="fas fa-dollar-sign icon-float"></i>
          <i class="fas fa-star sparkle"></i>
          <i class="fas fa-circle sparkle"></i>
          <i class="fas fa-star sparkle"></i>
          <i class="fas fa-circle sparkle"></i>
      </div>
      <div class="hero-content">
        <!-- Company Logo -->
        <img id="companyLogo" src="https://i.postimg.cc/W1gJVPqt/Screenshot-2025-07-20-at-21-48-13.png" alt="iFinance Logo" class="company-logo"
             onerror="this.style.display='none'; document.getElementById('logoFallback').style.display='flex';">
        <div id="logoFallback" class="company-logo-fallback">
            <span>iFinance</span>
        </div>

        <!-- !!! IMPORTANT: CUSTOMIZE THIS H1 AND P FOR EACH PAGE !!! -->
        <h1>Your Financial Dream Weaver</h1>
        <p>Every great journey begins with a single step. What big dream are you nurturing in your heart? Let's chart a path to make it a reality, together.</p>

        <!-- Back to Main Page Button (Optional, but recommended for consistency) -->
        <a href="<?= ScriptApp.getService().getUrl() ?>?page=index" class="cta-button back-to-main">
            <i class="fas fa-home"></i> Back to Main Page
        </a>
      </div>
    </div>

    <!-- Horizontal Tabbed Navigation Bar -->
    <div class="tab-navigation">
        <button class="tab-button active" data-tab="dreamPlanningSection">
            <i class="fas fa-rocket"></i> Dream Planning
        </button>
        <button class="tab-button" data-tab="retirementSecuritySection">
            <i class="fas fa-umbrella-beach"></i> Retirement Security
        </button>
        <button class="tab-button" data-tab="comprehensivePlanningSection">
            <i class="fas fa-chart-pie"></i> Comprehensive Planning
        </button>
    </div>

    <!-- Main Content Area - All sections will be here -->
    <div id="mainContent">
        <!-- Main Category Cards (now jump links) - HIDDEN -->
        <div class="story-cards-container" id="mainStoryCardsContainer">
            <div class="story-card" onclick="showCategoryTab('dreamPlanningSection')">
                <i class="fas fa-rocket"></i>
                <h3>Plan Your Dreams</h3>
                <p>Ready to turn your aspirations into achievable goals? Whether it's a new home, your child's education, or a dream vacation, let's map out your path.</p>
                <button class="explore-button">Explore Dream Calculators</button>
            </div>
            <div class="story-card" onclick="showCategoryTab('retirementSecuritySection')">
                <i class="fas fa-umbrella-beach"></i>
                <h3>Secure Your Retirement</h3>
                <p>Imagine a worry-free retirement. Plan for a steady income stream and ensure your golden years are truly golden. Let's build your financial freedom.</p>
                <button class="explore-button">Explore Retirement Calculators</button>
            </div>
            <div class="story-card" onclick="showCategoryTab('comprehensivePlanningSection')">
                <i class="fas fa-chart-pie"></i>
                <h3>Comprehensive Planning</h3>
                <p>Beyond individual goals, understand your overall financial health. Optimize your investments and ensure every rupee works hard for your future.</p>
                <button class="explore-button">Discover More Tools</button>
            </div>
        </div>

        <!-- Dream Planning Section -->
        <section id="dreamPlanningSection" class="full-page-section">
            <h2><i class="fas fa-rocket"></i> Plan Your Dreams: Goal-Oriented Calculators</h2>
            <p class="intro-text">These tools help you set clear financial goals and determine the investment path needed to achieve them.</p>

            <!-- Sub-Tab Navigation for Dream Planning -->
            <div class="sub-tab-navigation" id="dreamPlanningSubTabs">
                <button class="sub-tab-button active" data-calculator="calculator1">
                    <i class="fas fa-bullseye"></i> SIP Required
                </button>
                <button class="sub-tab-button" data-calculator="calculator2">
                    <i class="fas fa-chart-area"></i> FV of SIP
                </button>
                <button class="sub-tab-button" data-calculator="calculator3">
                    <i class="fas fa-hand-holding-usd"></i> Lumpsum Required
                </button>
                <button class="sub-tab-button" data-calculator="calculator4">
                    <i class="fas fa-money-bill-wave"></i> FV of Lumpsum
                </button>
            </div>

            <!-- Calculator 1: SIP Required for Future Goal -->
            <div class="calculator-section" id="calculator1">
                <h2><i class="fas fa-bullseye"></i> SIP Required for Future Goal</h2>
                <p class="intro-text">Calculate the monthly SIP (Systematic Investment Plan) needed to reach a specific financial goal by a certain time.</p>

                <div class="input-group">
                    <label for="goalAmountSlider"><i class="fas fa-rupee-sign"></i> Goal Amount:</label>
                    <div class="input-controls">
                        <input type="range" id="goalAmountSlider" min="100000" max="100000000" step="100000" value="5000000">
                        <input type="number" id="goalAmountInput" value="5000000">
                        <span class="slider-value" id="goalAmountValue">₹ 50 Lakhs</span>
                    </div>
                </div>

                <div class="input-group">
                    <label for="timeYearsSlider"><i class="fas fa-calendar-alt"></i> Time Horizon (Years):</label>
                    <div class="input-controls">
                        <input type="range" id="timeYearsSlider" min="1" max="50" step="1" value="10">
                        <input type="number" id="timeYearsInput" value="10" class="percent-input">
                        <span class="slider-value" id="timeYearsValue">10 Years</span>
                    </div>
                </div>

                <div class="input-group">
                    <label for="expectedReturnSlider"><i class="fas fa-chart-line"></i> Expected Annual Return (%):</label>
                    <div class="input-controls">
                        <input type="range" id="expectedReturnSlider" min="0.1" max="25" step="0.1" value="12">
                        <input type="number" id="expectedReturnInput" value="12" step="0.1" class="percent-input">
                        <span class="slider-value" id="expectedReturnValue">12.0 %</span>
                    </div>
                </div>

                <button onclick="calculateSIPRequired()">
                    <i class="fas fa-calculator"></i> Calculate SIP
                </button>

                <div class="output-section" id="sipGoalOutput">
                    <h3><i class="fas fa-piggy-bank"></i> Monthly SIP Required:</h3>
                    <p class="output-message" id="outputMessage"></p>
                    <div class="output-value" id="sipRequiredAmount">₹ 0</div>
                    <div id="chart_div" class="chart-container"></div>
                </div>
            </div>

            <!-- Calculator 2: Future Value of SIP -->
            <div class="calculator-section" id="calculator2">
                <h2><i class="fas fa-chart-area"></i> Future Value of SIP</h2>
                <p class="intro-text">See how your regular monthly investments (SIPs) can grow over time, thanks to the power of compounding.</p>

                <div class="input-group">
                    <label for="sipAmountSlider"><i class="fas fa-rupee-sign"></i> Monthly SIP Amount:</label>
                    <div class="input-controls">
                        <input type="range" id="sipAmountSlider" min="500" max="100000" step="100" value="5000">
                        <input type="number" id="sipAmountInput" value="5000">
                        <span class="slider-value" id="sipAmountValue">₹ 5,000</span>
                    </div>
                </div>

                <div class="input-group">
                    <label for="fvTimeYearsSlider"><i class="fas fa-calendar-alt"></i> Time Horizon (Years):</label>
                    <div class="input-controls">
                        <input type="range" id="fvTimeYearsSlider" min="1" max="50" step="1" value="15">
                        <input type="number" id="fvTimeYearsInput" value="15" class="percent-input">
                        <span class="slider-value" id="fvTimeYearsValue">15 Years</span>
                    </div>
                </div>

                <div class="input-group">
                    <label for="fvExpectedReturnSlider"><i class="fas fa-chart-line"></i> Expected Annual Return (%):</label>
                    <div class="input-controls">
                        <input type="range" id="fvExpectedReturnSlider" min="0.1" max="25" step="0.1" value="12">
                        <input type="number" id="fvExpectedReturnInput" value="12" step="0.1" class="percent-input">
                        <span class="slider-value" id="fvExpectedReturnValue">12.0 %</span>
                    </div>
                </div>

                <button onclick="calculateFutureValueOfSIP()">
                    <i class="fas fa-calculator"></i> Calculate Future Value
                </button>

                <div class="output-section" id="sipFVOutput">
                    <h3><i class="fas fa-sack-dollar"></i> Estimated Future Corpus:</h3>
                    <p class="output-message" id="fvOutputMessage"></p>
                    <div class="output-value" id="fvCorpusAmount">₹ 0</div>
                    <div id="fv_chart_div" class="chart-container"></div>
                </div>
            </div>

            <!-- Calculator 3: Lumpsum Required for Future Goal -->
            <div class="calculator-section" id="calculator3">
                <h2><i class="fas fa-hand-holding-usd"></i> Lumpsum Required for Future Goal</h2>
                <p class="intro-text">Determine the one-time lump sum investment needed today to achieve a specific financial goal in the future.</p>

                <div class="input-group">
                    <label for="lumpsumGoalAmountSlider"><i class="fas fa-rupee-sign"></i> Goal Amount:</label>
                    <div class="input-controls">
                        <input type="range" id="lumpsumGoalAmountSlider" min="100000" max="100000000" step="100000" value="10000000">
                        <input type="number" id="lumpsumGoalAmountInput" value="10000000">
                        <span class="slider-value" id="lumpsumGoalAmountValue">₹ 1 Crore</span>
                    </div>
                </div>

                <div class="input-group">
                    <label for="lumpsumTimeYearsSlider"><i class="fas fa-calendar-alt"></i> Time Horizon (Years):</label>
                    <div class="input-controls">
                        <input type="range" id="lumpsumTimeYearsSlider" min="1" max="50" step="1" value="10">
                        <input type="number" id="lumpsumTimeYearsInput" value="10" class="percent-input">
                        <span class="slider-value" id="lumpsumTimeYearsValue">10 Years</span>
                    </div>
                </div>

                <div class="input-group">
                    <label for="lumpsumExpectedReturnSlider"><i class="fas fa-chart-line"></i> Expected Annual Return (%):</label>
                    <div class="input-controls">
                        <input type="range" id="lumpsumExpectedReturnSlider" min="0.1" max="25" step="0.1" value="10">
                        <input type="number" id="lumpsumExpectedReturnInput" value="10" step="0.1" class="percent-input">
                        <span class="slider-value" id="lumpsumExpectedReturnValue">10.0 %</span>
                    </div>
                </div>

                <button onclick="calculateLumpsumRequired()">
                    <i class="fas fa-calculator"></i> Calculate Lumpsum
                </button>

                <div class="output-section" id="lumpsumGoalOutput">
                    <h3><i class="fas fa-coins"></i> Lumpsum Investment Required:</h3>
                    <p class="output-message" id="lumpsumOutputMessage"></p>
                    <div class="output-value" id="lumpsumRequiredAmount">₹ 0</div>
                    <div id="lumpsum_chart_div" class="chart-container"></div>
                </div>
            </div>

            <!-- Calculator 4: Future Value of Lumpsum -->
            <div class="calculator-section" id="calculator4">
                <h2><i class="fas fa-money-bill-wave"></i> Future Value of Lumpsum</h2>
                <p class="intro-text">Project the growth of a one-time investment over a period, demonstrating the power of compounding on a single sum.</p>

                <div class="input-group">
                    <label for="fvLumpsumAmountSlider"><i class="fas fa-rupee-sign"></i> Lumpsum Amount:</label>
                    <div class="input-controls">
                        <input type="range" id="fvLumpsumAmountSlider" min="100000" max="100000000" step="100000" value="1000000">
                        <input type="number" id="fvLumpsumAmountInput" value="1000000">
                        <span class="slider-value" id="fvLumpsumAmountValue">₹ 10 Lakhs</span>
                    </div>
                </div>

                <div class="input-group">
                    <label for="fvLumpsumTimeYearsSlider"><i class="fas fa-calendar-alt"></i> Time Horizon (Years):</label>
                    <div class="input-controls">
                        <input type="range" id="fvLumpsumTimeYearsSlider" min="1" max="50" step="1" value="20">
                        <input type="number" id="fvLumpsumTimeYearsInput" value="20" class="percent-input">
                        <span class="slider-value" id="fvLumpsumTimeYearsValue">20 Years</span>
                    </div>
                </div>

                <div class="input-group">
                    <label for="fvLumpsumExpectedReturnSlider"><i class="fas fa-chart-line"></i> Expected Annual Return (%):</label>
                    <div class="input-controls">
                        <input type="range" id="fvLumpsumExpectedReturnSlider" min="0.1" max="25" step="0.1" value="10">
                        <input type="number" id="fvLumpsumExpectedReturnInput" value="10" step="0.1" class="percent-input">
                        <span class="slider-value" id="fvLumpsumExpectedReturnValue">10.0 %</span>
                    </div>
                </div>

                <button onclick="calculateFutureValueOfLumpsum()">
                    <i class="fas fa-calculator"></i> Calculate Future Value
                </button>

                <div class="output-section" id="fvLumpsumOutput">
                    <h3><i class="fas fa-sack-dollar"></i> Estimated Future Corpus:</h3>
                    <p class="output-message" id="fvLumpsumOutputMessage"></p>
                    <div class="output-value" id="fvLumpsumCorpusAmount">₹ 0</div>
                    <div id="fv_lumpsum_chart_div" class="chart-container"></div>
                </div>
            </div>
        </section>

        <!-- Retirement Security Section -->
        <section id="retirementSecuritySection" class="full-page-section">
            <h2><i class="fas fa-umbrella-beach"></i> Secure Your Retirement: Income & Corpus Tools</h2>
            <p class="intro-text">Plan for a comfortable and worry-free retirement. These tools help you manage your post-retirement income and ensure your corpus lasts.</p>

            <!-- Sub-Tab Navigation for Retirement Security -->
            <div class="sub-tab-navigation" id="retirementSecuritySubTabs">
                <button class="sub-tab-button active" data-calculator="calculator5">
                    <i class="fas fa-hand-holding-heart"></i> SWP from Corpus
                </button>
                <button class="sub-tab-button" data-calculator="calculator6">
                    <i class="fas fa-sack-dollar"></i> Corpus for SWP
                </button>
                <button class="sub-tab-button" data-calculator="calculator12">
                    <i class="fas fa-chart-area"></i> Inflation-Adj SWP
                </button>
                <button class="sub-tab-button" data-calculator="calculator13">
                    <i class="fas fa-balance-scale"></i> Retirement Analysis
                </button>
            </div>

            <!-- Calculator 5: SWP from Retirement Corpus -->
            <div class="calculator-section" id="calculator5">
                <h2><i class="fas fa-hand-holding-heart"></i> SWP from Retirement Corpus</h2>
                <p class="intro-text">Calculate the monthly income you can systematically withdraw from your retirement savings to last a specified period.</p>

                <div class="input-group">
                    <label for="swpCorpusAmountSlider"><i class="fas fa-rupee-sign"></i> Initial Retirement Corpus:</label>
                    <div class="input-controls">
                        <input type="range" id="swpCorpusAmountSlider" min="1000000" max="1000000000" step="1000000" value="50000000">
                        <input type="number" id="swpCorpusAmountInput" value="50000000">
                        <span class="slider-value" id="swpCorpusAmountValue">₹ 5 Crores</span>
                    </div>
                </div>

                <div class="input-group">
                    <label for="swpWithdrawalYearsSlider"><i class="fas fa-calendar-alt"></i> Withdrawal Period (Years):</label>
                    <div class="input-controls">
                        <input type="range" id="swpWithdrawalYearsSlider" min="1" max="50" step="1" value="25">
                        <input type="number" id="swpWithdrawalYearsInput" value="25" class="percent-input">
                        <span class="slider-value" id="swpWithdrawalYearsValue">25 Years</span>
                    </div>
                </div>

                <div class="input-group">
                    <label for="swpExpectedReturnSlider"><i class="fas fa-chart-line"></i> Expected Annual Return (%):</label>
                    <div class="input-controls">
                        <input type="range" id="swpExpectedReturnSlider" min="0.1" max="15" step="0.1" value="8">
                        <input type="number" id="swpExpectedReturnInput" value="8" step="0.1" class="percent-input">
                        <span class="slider-value" id="swpExpectedReturnValue">8.0 %</span>
                    </div>
                </div>

                <button onclick="calculateSWPFromCorpus()">
                    <i class="fas fa-calculator"></i> Calculate Monthly SWP
                </button>

                <div class="output-section" id="swpOutput">
                    <h3><i class="fas fa-hand-holding-usd"></i> Monthly SWP Amount:</h3>
                    <p class="output-message" id="swpOutputMessage"></p>
                    <div class="output-value" id="swpAmount">₹ 0</div>
                    <div id="swp_chart_div" class="chart-container"></div>
                </div>
            </div>

            <!-- Calculator 6: Corpus Required for SWP -->
            <div class="calculator-section" id="calculator6">
                <h2><i class="fas fa-sack-dollar"></i> Corpus Required for SWP</h2>
                <p class="intro-text">Determine the total retirement corpus you need to build to generate a desired monthly income for your post-retirement years.</p>

                <div class="input-group">
                    <label for="crfswpMonthlySWPSlider"><i class="fas fa-rupee-sign"></i> Desired Monthly SWP:</label>
                    <div class="input-controls">
                        <input type="range" id="crfswpMonthlySWPSlider" min="10000" max="500000" step="1000" value="75000">
                        <input type="number" id="crfswpMonthlySWPInput" value="75000">
                        <span class="slider-value" id="crfswpMonthlySWPValue">₹ 75,000</span>
                    </div>
                </div>

                <div class="input-group">
                    <label for="crfswpWithdrawalYearsSlider"><i class="fas fa-calendar-alt"></i> Withdrawal Period (Years):</label>
                    <div class="input-controls">
                        <input type="range" id="crfswpWithdrawalYearsSlider" min="1" max="50" step="1" value="25">
                        <input type="number" id="crfswpWithdrawalYearsInput" value="25" class="percent-input">
                        <span class="slider-value" id="crfswpWithdrawalYearsValue">25 Years</span>
                    </div>
                </div>

                <div class="input-group">
                    <label for="crfswpExpectedReturnSlider"><i class="fas fa-chart-line"></i> Expected Annual Return (%):</label>
                    <div class="input-controls">
                        <input type="range" id="crfswpExpectedReturnSlider" min="0.1" max="15" step="0.1" value="8">
                        <input type="number" id="crfswpExpectedReturnInput" value="8" step="0.1" class="percent-input">
                        <span class="slider-value" id="crfswpExpectedReturnValue">8.0 %</span>
                    </div>
                </div>

                <button onclick="calculateCorpusRequiredForSWP()">
                    <i class="fas fa-calculator"></i> Calculate Required Corpus
                </button>

                <div class="output-section" id="crfswpOutput">
                    <h3><i class="fas fa-piggy-bank"></i> Required Retirement Corpus:</h3>
                    <p class="output-message" id="crfswpOutputMessage"></p>
                    <div class="output-value" id="requiredCorpusAmount">₹ 0</div>
                    <div id="crfswp_chart_div" class="chart-container"></div>
                </div>
            </div>

            <!-- Calculator 12: Inflation-Adjusted SWP -->
            <div class="calculator-section" id="calculator12">
                <h2><i class="fas fa-chart-area"></i> Inflation-Adjusted SWP</h2>
                <p class="intro-text">Ensure your retirement income keeps pace with rising costs. Calculate a monthly withdrawal that automatically adjusts for inflation.</p>

                <div class="input-group">
                    <label for="iaswpCorpusAmountSlider"><i class="fas fa-rupee-sign"></i> Initial Retirement Corpus:</label>
                    <div class="input-controls">
                        <input type="range" id="iaswpCorpusAmountSlider" min="1000000" max="1000000000" step="1000000" value="10000000">
                        <input type="number" id="iaswpCorpusAmountInput" value="10000000">
                        <span class="slider-value" id="iaswpCorpusAmountValue">₹ 1 Crore</span>
                    </div>
                </div>

                <div class="input-group">
                    <label for="iaswpWithdrawalYearsSlider"><i class="fas fa-calendar-alt"></i> Withdrawal Period (Years):</label>
                    <div class="input-controls">
                        <input type="range" id="iaswpWithdrawalYearsSlider" min="1" max="50" step="1" value="20">
                        <input type="number" id="iaswpWithdrawalYearsInput" value="20" class="percent-input">
                        <span class="slider-value" id="iaswpWithdrawalYearsValue">20 Years</span>
                    </div>
                </div>

                <div class="input-group">
                    <label for="iaswpExpectedReturnSlider"><i class="fas fa-chart-line"></i> Expected Annual Return:</label>
                    <div class="input-controls">
                        <input type="range" id="iaswpExpectedReturnSlider" min="0.1" max="15" step="0.1" value="8">
                        <input type="number" id="iaswpExpectedReturnInput" value="8" step="0.1" class="percent-input">
                        <span class="slider-value" id="iaswpExpectedReturnValue">8.0 %</span>
                    </div>
                </div>

                <div class="input-group">
                    <label for="iaswpInflationRateSlider"><i class="fas fa-money-bill-wave"></i> Expected Inflation Rate:</label>
                    <div class="input-controls">
                        <input type="range" id="iaswpInflationRateSlider" min="0.1" max="10" step="0.1" value="5">
                        <input type="number" id="iaswpInflationRateInput" value="5" step="0.1" class="percent-input">
                        <span class="slider-value" id="iaswpInflationRateValue">5.0 %</span>
                    </div>
                </div>

                <button onclick="calculateInflationAdjustedSWP()">
                    <i class="fas fa-calculator"></i> Calculate Inflation-Adjusted SWP
                </button>

                <div class="output-section" id="iaswpOutput">
                    <h3><i class="fas fa-hand-holding-usd"></i> Your Initial Monthly Withdrawal!</h3>
                    <p class="output-message" id="iaswpOutputMessage"></p>
                    <div class="output-value" id="iaswpMonthlySWPAmount">₹ 0</div>
                    <p>This is your starting monthly income, designed to grow with inflation and maintain your purchasing power.</p>
                    <div id="iaswp_chart_div" class="chart-container"></div>
                </div>
            </div>

            <!-- Calculator 13: Retirement Shortfall/Surplus Analysis -->
            <div class="calculator-section" id="calculator13">
                <h2><i class="fas fa-balance-scale"></i> Retirement Shortfall/Surplus Analysis</h2>
                <p class="intro-text">Are you on track for your desired retirement? This analysis compares your projected corpus with what you'll actually need, revealing any gaps or surpluses.</p>

                <div class="input-group">
                    <label for="rsaCurrentCorpusSlider"><i class="fas fa-piggy-bank"></i> Current Retirement Corpus:</label>
                    <div class="input-controls">
                        <input type="range" id="rsaCurrentCorpusSlider" min="0" max="1000000000" step="100000" value="0">
                        <input type="number" id="rsaCurrentCorpusInput" value="0">
                        <span class="slider-value" id="rsaCurrentCorpusValue">₹ 0</span>
                    </div>
                </div>

                <div class="input-group">
                    <label for="rsaMonthlySIPSlider"><i class="fas fa-rupee-sign"></i> Monthly SIP till Retirement:</label>
                    <div class="input-controls">
                        <input type="range" id="rsaMonthlySIPSlider" min="0" max="100000" step="500" value="10000">
                        <input type="number" id="rsaMonthlySIPInput" value="10000">
                        <span class="slider-value" id="rsaMonthlySIPValue">₹ 10,000</span>
                    </div>
                </div>

                <div class="input-group">
                    <label for="rsaYearsToRetirementSlider"><i class="fas fa-calendar-day"></i> Years to Retirement:</label>
                    <div class="input-controls">
                        <input type="range" id="rsaYearsToRetirementSlider" min="0" max="50" step="1" value="20">
                        <input type="number" id="rsaYearsToRetirementInput" value="20" class="percent-input">
                        <span class="slider-value" id="rsaYearsToRetirementValue">20 Years</span>
                    </div>
                </div>

                <div class="input-group">
                    <label for="rsaDesiredMonthlyIncomeSlider"><i class="fas fa-hand-holding-usd"></i> Desired Monthly Income in Retirement (Today's Value):</label>
                    <div class="input-controls">
                        <input type="range" id="rsaDesiredMonthlyIncomeSlider" min="10000" max="500000" step="1000" value="50000">
                        <input type="number" id="rsaDesiredMonthlyIncomeInput" value="50000">
                        <span class="slider-value" id="rsaDesiredMonthlyIncomeValue">₹ 50,000</span>
                    </div>
                </div>

                <div class="input-group">
                    <label for="rsaRetirementDurationSlider"><i class="fas fa-hourglass-end"></i> Retirement Duration (Years):</label>
                    <div class="input-controls">
                        <input type="range" id="rsaRetirementDurationSlider" min="1" max="50" step="1" value="25">
                        <input type="number" id="rsaRetirementDurationInput" value="25" class="percent-input">
                        <span class="slider-value" id="rsaRetirementDurationValue">25 Years</span>
                    </div>
                </div>

                <div class="input-group">
                    <label for="rsaReturnPreRetirementSlider"><i class="fas fa-chart-line"></i> Expected Return (Pre-Retirement):</label>
                    <div class="input-controls">
                        <input type="range" id="rsaReturnPreRetirementSlider" min="1" max="25" step="0.1" value="12">
                        <input type="number" id="rsaReturnPreRetirementInput" value="12" step="0.1" class="percent-input">
                        <span class="slider-value" id="rsaReturnPreRetirementValue">12.0 %</span>
                    </div>
                </div>

                <div class="input-group">
                    <label for="rsaReturnPostRetirementSlider"><i class="fas fa-chart-pie"></i> Expected Return (Post-Retirement):</label>
                    <div class="input-controls">
                        <input type="range" id="rsaReturnPostRetirementSlider" min="0.1" max="15" step="0.1" value="8">
                        <input type="number" id="rsaReturnPostRetirementInput" value="8" step="0.1" class="percent-input">
                        <span class="slider-value" id="rsaReturnPostRetirementValue">8.0 %</span>
                    </div>
                </div>

                <div class="input-group">
                    <label for="rsaInflationRateSlider"><i class="fas fa-money-bill-wave"></i> Expected Inflation Rate:</label>
                    <div class="input-controls">
                        <input type="range" id="rsaInflationRateSlider" min="0.1" max="10" step="0.1" value="5">
                        <input type="number" id="rsaInflationRateInput" value="5" step="0.1" class="percent-input">
                        <span class="slider-value" id="rsaInflationRateValue">5.0 %</span>
                    </div>
                </div>

                <div class="input-group">
                    <label for="rsaLumpsumWithdrawalsInput"><i class="fas fa-sack-xmark"></i> Planned Lumpsum Withdrawals (Amount@Year, e.g., 5000000@5, 2000000@10):</label>
                    <div class="input-controls">
                        <input type="text" id="rsaLumpsumWithdrawalsInput" placeholder="e.g., 5000000@5, 2000000@10" value="">
                    </div>
                </div>

                <button onclick="calculateRetirementAnalysis()">
                    <i class="fas fa-search-dollar"></i> Analyze My Retirement
                </button>

                <div class="output-section" id="rsaOutput">
                    <h3><i class="fas fa-check-circle"></i> Retirement Readiness Analysis!</h3>
                    <p class="output-message" id="rsaOutputMessage"></p>
                    <div class="output-row">
                        <p>Projected Corpus at Retirement:</p>
                        <div class="output-value" id="rsaProjectedCorpus">₹ 0</div>
                    </div>
                    <div class="output-row">
                        <p>Required Corpus for Desired Income:</p>
                        <div class="output-value" id="rsaRequiredCorpus">₹ 0</div>
                    </div>
                    <div class="output-row">
                        <p>Shortfall / Surplus:</p>
                        <div class="output-value" id="rsaShortfallSurplus">₹ 0</div>
                    </div>
                    <p>This analysis helps you understand if your current plan is sufficient or if adjustments are needed to achieve your retirement dreams.</p>
                    <div id="rsa_chart_div" class="chart-container"></div>
                </div>
            </div>
        </section>

        <!-- Comprehensive Planning Section -->
        <section id="comprehensivePlanningSection" class="full-page-section">
            <h2><i class="fas fa-chart-pie"></i> Comprehensive Planning: Advanced Tools</h2>
            <p class="intro-text">Beyond individual goals, understand your overall financial health. Optimize your investments and ensure every rupee works hard for your future.</p>

            <!-- Sub-Tab Navigation for Comprehensive Planning -->
            <div class="sub-tab-navigation" id="comprehensivePlanningSubTabs">
                <button class="sub-tab-button active" data-calculator="calculator7">
                    <i class="fas fa-hourglass-half"></i> FV Limited SIP
                </button>
                <button class="sub-tab-button" data-calculator="calculator8">
                    <i class="fas fa-calendar-plus"></i> Limited SIP Required
                </button>
                <button class="sub-tab-button" data-calculator="calculator9">
                    <i class="fas fa-hand-holding-usd"></i> FV SIP + One-Time
                </button>
                <button class="sub-tab-button" data-calculator="calculator10">
                    <i class="fas fa-piggy-bank"></i> One-Time Required
                </button>
                <button class="sub-tab-button" data-calculator="calculator11">
                    <i class="fas fa-calendar-check"></i> SIP Required
                </button>
            </div>

            <!-- Calculator 7: Future Value of Limited Period SIP -->
            <div class="calculator-section" id="calculator7">
                <h2><i class="fas fa-hourglass-half"></i> Future Value of Limited Period SIP</h2>
                <p class="intro-text">Calculate the future value of a SIP where contributions are made for a limited period, but the corpus continues to grow thereafter.</p>

                <div class="input-group">
                    <label for="fvlsMonthlySIPSlider"><i class="fas fa-rupee-sign"></i> Monthly SIP Amount:</label>
                    <div class="input-controls">
                        <input type="range" id="fvlsMonthlySIPSlider" min="500" max="100000" step="100" value="10000">
                        <input type="number" id="fvlsMonthlySIPInput" value="10000">
                        <span class="slider-value" id="fvlsMonthlySIPValue">₹ 10,000</span>
                    </div>
                </div>

                <div class="input-group">
                    <label for="fvlsSipPeriodSlider"><i class="fas fa-calendar-check"></i> SIP Period (Years):</label>
                    <div class="input-controls">
                        <input type="range" id="fvlsSipPeriodSlider" min="1" max="30" step="1" value="10">
                        <input type="number" id="fvlsSipPeriodInput" value="10" class="percent-input">
                        <span class="slider-value" id="fvlsSipPeriodValue">10 Years</span>
                    </div>
                </div>

                <div class="input-group">
                    <label for="fvlsGrowthPeriodSlider"><i class="fas fa-chart-line"></i> Total Growth Period (Years):</label>
                    <div class="input-controls">
                        <input type="range" id="fvlsGrowthPeriodSlider" min="1" max="50" step="1" value="20">
                        <input type="number" id="fvlsGrowthPeriodInput" value="20" class="percent-input">
                        <span class="slider-value" id="fvlsGrowthPeriodValue">20 Years</span>
                    </div>
                </div>

                <div class="input-group">
                    <label for="fvlsExpectedReturnSlider"><i class="fas fa-percent"></i> Expected Annual Return (%):</label>
                    <div class="input-controls">
                        <input type="range" id="fvlsExpectedReturnSlider" min="0.1" max="25" step="0.1" value="12">
                        <input type="number" id="fvlsExpectedReturnInput" value="12" step="0.1" class="percent-input">
                        <span class="slider-value" id="fvlsExpectedReturnValue">12.0 %</span>
                    </div>
                </div>

                <button onclick="calculateFVLimitedSIP()">
                    <i class="fas fa-calculator"></i> Calculate Future Value
                </button>

                <div class="output-section" id="fvlsOutput">
                    <h3><i class="fas fa-sack-dollar"></i> Estimated Future Corpus:</h3>
                    <p class="output-message" id="fvlsOutputMessage"></p>
                    <div class="output-value" id="fvlsCorpusAmount">₹ 0</div>
                    <div id="fvls_chart_div" class="chart-container"></div>
                </div>
            </div>

            <!-- Calculator 8: Limited SIP Required for Goal -->
            <div class="calculator-section" id="calculator8">
                <h2><i class="fas fa-calendar-plus"></i> Limited SIP Required for Goal</h2>
                <p class="intro-text">Determine the monthly SIP needed for a limited period to achieve a future goal, considering continued growth after contributions stop.</p>

                <div class="input-group">
                    <label for="lsrgGoalAmountSlider"><i class="fas fa-rupee-sign"></i> Goal Amount:</label>
                    <div class="input-controls">
                        <input type="range" id="lsrgGoalAmountSlider" min="100000" max="100000000" step="100000" value="10000000">
                        <input type="number" id="lsrgGoalAmountInput" value="10000000">
                        <span class="slider-value" id="lsrgGoalAmountValue">₹ 1 Crore</span>
                    </div>
                </div>

                <div class="input-group">
                    <label for="lsrgSipPeriodSlider"><i class="fas fa-calendar-check"></i> SIP Period (Years):</label>
                    <div class="input-controls">
                        <input type="range" id="lsrgSipPeriodSlider" min="1" max="30" step="1" value="10">
                        <input type="number" id="lsrgSipPeriodInput" value="10" class="percent-input">
                        <span class="slider-value" id="lsrgSipPeriodValue">10 Years</span>
                    </div>
                </div>

                <div class="input-group">
                    <label for="lsrgGrowthPeriodSlider"><i class="fas fa-chart-line"></i> Total Growth Period (Years):</label>
                    <div class="input-controls">
                        <input type="range" id="lsrgGrowthPeriodSlider" min="1" max="50" step="1" value="20">
                        <input type="number" id="lsrgGrowthPeriodInput" value="20" class="percent-input">
                        <span class="slider-value" id="lsrgGrowthPeriodValue">20 Years</span>
                    </div>
                </div>

                <div class="input-group">
                    <label for="lsrgExpectedReturnSlider"><i class="fas fa-percent"></i> Expected Annual Return (%):</label>
                    <div class="input-controls">
                        <input type="range" id="lsrgExpectedReturnSlider" min="0.1" max="25" step="0.1" value="12">
                        <input type="number" id="lsrgExpectedReturnInput" value="12" step="0.1" class="percent-input">
                        <span class="slider-value" id="lsrgExpectedReturnValue">12.0 %</span>
                    </div>
                </div>

                <button onclick="calculateLimitedSIPRequired()">
                    <i class="fas fa-calculator"></i> Calculate Monthly SIP
                </button>

                <div class="output-section" id="lsrgOutput">
                    <h3><i class="fas fa-piggy-bank"></i> Monthly SIP Required:</h3>
                    <p class="output-message" id="lsrgOutputMessage"></p>
                    <div class="output-value" id="lsrgRequiredSIPAmount">₹ 0</div>
                    <div id="lsrg_chart_div" class="chart-container"></div>
                </div>
            </div>

            <!-- Calculator 9: Future Value of SIP + One-Time -->
            <div class="calculator-section" id="calculator9">
                <h2><i class="fas fa-hand-holding-usd"></i> Future Value of SIP + One-Time</h2>
                <p class="intro-text">Calculate the combined future value of both regular monthly investments (SIP) and a one-time lump sum investment.</p>

                <div class="input-group">
                    <label for="fvsotMonthlySIPSlider"><i class="fas fa-rupee-sign"></i> Monthly SIP Amount:</label>
                    <div class="input-controls">
                        <input type="range" id="fvsotMonthlySIPSlider" min="500" max="100000" step="100" value="5000">
                        <input type="number" id="fvsotMonthlySIPInput" value="5000">
                        <span class="slider-value" id="fvsotMonthlySIPValue">₹ 5,000</span>
                    </div>
                </div>

                <div class="input-group">
                    <label for="fvsotLumpsumAmountSlider"><i class="fas fa-coins"></i> One-Time Lumpsum Amount:</label>
                    <div class="input-controls">
                        <input type="range" id="fvsotLumpsumAmountSlider" min="0" max="100000000" step="100000" value="1000000">
                        <input type="number" id="fvsotLumpsumAmountInput" value="1000000">
                        <span class="slider-value" id="fvsotLumpsumAmountValue">₹ 10 Lakhs</span>
                    </div>
                </div>

                <div class="input-group">
                    <label for="fvsotTimeYearsSlider"><i class="fas fa-calendar-alt"></i> Time Horizon (Years):</label>
                    <div class="input-controls">
                        <input type="range" id="fvsotTimeYearsSlider" min="1" max="50" step="1" value="15">
                        <input type="number" id="fvsotTimeYearsInput" value="15" class="percent-input">
                        <span class="slider-value" id="fvsotTimeYearsValue">15 Years</span>
                    </div>
                </div>

                <div class="input-group">
                    <label for="fvsotExpectedReturnSlider"><i class="fas fa-chart-line"></i> Expected Annual Return (%):</label>
                    <div class="input-controls">
                        <input type="range" id="fvsotExpectedReturnSlider" min="0.1" max="25" step="0.1" value="12">
                        <input type="number" id="fvsotExpectedReturnInput" value="12" step="0.1" class="percent-input">
                        <span class="slider-value" id="fvsotExpectedReturnValue">12.0 %</span>
                    </div>
                </div>

                <button onclick="calculateFVSIPOneTime()">
                    <i class="fas fa-calculator"></i> Calculate Combined Future Value
                </button>

                <div class="output-section" id="fvsotOutput">
                    <h3><i class="fas fa-sack-dollar"></i> Estimated Combined Future Corpus:</h3>
                    <p class="output-message" id="fvsotOutputMessage"></p>
                    <div class="output-value" id="fvsotCorpusAmount">₹ 0</div>
                    <div id="fvsot_chart_div" class="chart-container"></div>
                </div>
            </div>

            <!-- Calculator 10: One-Time Required (if SIP known) -->
            <div class="calculator-section" id="calculator10">
                <h2><i class="fas fa-piggy-bank"></i> One-Time Required (if SIP known)</h2>
                <p class="intro-text">Determine the additional one-time lump sum investment needed to reach a goal, given an existing monthly SIP.</p>

                <div class="input-group">
                    <label for="otrsikGoalAmountSlider"><i class="fas fa-rupee-sign"></i> Goal Amount:</label>
                    <div class="input-controls">
                        <input type="range" id="otrsikGoalAmountSlider" min="100000" max="100000000" step="100000" value="5000000">
                        <input type="number" id="otrsikGoalAmountInput" value="5000000">
                        <span class="slider-value" id="otrsikGoalAmountValue">₹ 50 Lakhs</span>
                    </div>
                </div>

                <div class="input-group">
                    <label for="otrsikMonthlySIPSlider"><i class="fas fa-hand-holding-usd"></i> Existing Monthly SIP:</label>
                    <div class="input-controls">
                        <input type="range" id="otrsikMonthlySIPSlider" min="0" max="100000" step="500" value="5000">
                        <input type="number" id="otrsikMonthlySIPInput" value="5000">
                        <span class="slider-value" id="otrsikMonthlySIPValue">₹ 5,000</span>
                    </div>
                </div>

                <div class="input-group">
                    <label for="otrsikTimeYearsSlider"><i class="fas fa-calendar-alt"></i> Time Horizon (Years):</label>
                    <div class="input-controls">
                        <input type="range" id="otrsikTimeYearsSlider" min="1" max="50" step="1" value="10">
                        <input type="number" id="otrsikTimeYearsInput" value="10" class="percent-input">
                        <span class="slider-value" id="otrsikTimeYearsValue">10 Years</span>
                    </div>
                </div>

                <div class="input-group">
                    <label for="otrsikExpectedReturnSlider"><i class="fas fa-chart-line"></i> Expected Annual Return (%):</label>
                    <div class="input-controls">
                        <input type="range" id="otrsikExpectedReturnSlider" min="0.1" max="25" step="0.1" value="12">
                        <input type="number" id="otrsikExpectedReturnInput" value="12" step="0.1" class="percent-input">
                        <span class="slider-value" id="otrsikExpectedReturnValue">12.0 %</span>
                    </div>
                </div>

                <button onclick="calculateOneTimeRequiredIfSIPKnown()">
                    <i class="fas fa-calculator"></i> Calculate One-Time Required
                </button>

                <div class="output-section" id="otrsikOutput">
                    <h3><i class="fas fa-coins"></i> One-Time Lumpsum Required:</h3>
                    <p class="output-message" id="otrsikOutputMessage"></p>
                    <div class="output-value" id="otrsikRequiredLumpsumAmount">₹ 0</div>
                    <div id="otrsik_chart_div" class="chart-container"></div>
                </div>
            </div>

            <!-- Calculator 11: SIP Required (if One-Time known) -->
            <div class="calculator-section" id="calculator11">
                <h2><i class="fas fa-calendar-check"></i> SIP Required (if One-Time known)</h2>
                <p class="intro-text">Calculate the monthly SIP needed to reach a goal, given an existing one-time lump sum investment.</p>

                <div class="input-group">
                    <label for="sriotkGoalAmountSlider"><i class="fas fa-rupee-sign"></i> Goal Amount:</label>
                    <div class="input-controls">
                        <input type="range" id="sriotkGoalAmountSlider" min="100000" max="100000000" step="100000" value="5000000">
                        <input type="number" id="sriotkGoalAmountInput" value="5000000">
                        <span class="slider-value" id="sriotkGoalAmountValue">₹ 50 Lakhs</span>
                    </div>
                </div>

                <div class="input-group">
                    <label for="sriotkLumpsumAmountSlider"><i class="fas fa-coins"></i> Existing One-Time Lumpsum:</label>
                    <div class="input-controls">
                        <input type="range" id="sriotkLumpsumAmountSlider" min="0" max="100000000" step="100000" value="1000000">
                        <input type="number" id="sriotkLumpsumAmountInput" value="1000000">
                        <span class="slider-value" id="sriotkLumpsumAmountValue">₹ 10 Lakhs</span>
                    </div>
                </div>

                <div class="input-group">
                    <label for="sriotkTimeYearsSlider"><i class="fas fa-calendar-alt"></i> Time Horizon (Years):</label>
                    <div class="input-controls">
                        <input type="range" id="sriotkTimeYearsSlider" min="1" max="50" step="1" value="10">
                        <input type="number" id="sriotkTimeYearsInput" value="10" class="percent-input">
                        <span class="slider-value" id="sriotkTimeYearsValue">10 Years</span>
                    </div>
                </div>

                <div class="input-group">
                    <label for="sriotkExpectedReturnSlider"><i class="fas fa-chart-line"></i> Expected Annual Return (%):</label>
                    <div class="input-controls">
                        <input type="range" id="sriotkExpectedReturnSlider" min="0.1" max="25" step="0.1" value="12">
                        <input type="number" id="sriotkExpectedReturnInput" value="12" step="0.1" class="percent-input">
                        <span class="slider-value" id="sriotkExpectedReturnValue">12.0 %</span>
                    </div>
                </div>

                <button onclick="calculateSIPRequiredIfOneTimeKnown()">
                    <i class="fas fa-calculator"></i> Calculate Monthly SIP
                </button>

                <div class="output-section" id="sriotkOutput">
                    <h3><i class="fas fa-piggy-bank"></i> Monthly SIP Required:</h3>
                    <p class="output-message" id="sriotkOutputMessage"></p>
                    <div class="output-value" id="sriotkRequiredSIPAmount">₹ 0</div>
                    <div id="sriotk_chart_div" class="chart-container"></div>
                </div>
            </div>
        </section>
    </div>
      <!-- START: MFD Credentials Footer -->

  <footer class="site-footer">

    <p>AMFI Registered MFD || ARN : 255364</p>

  </footer>

  <!-- END: MFD Credentials Footer -->
</div> <!-- Closing tag for .container -->


  <!-- Google Charts Library (Loaded once globally) -->
  <script type="text/javascript" src="https://www.gstatic.com/charts/loader.js"></script>
  <script>
    // ... rest of your script ...
  </script>
</body>
</html>
  <!-- Google Charts Library (Loaded once globally) -->
  <script type="text/javascript" src="https://www.gstatic.com/charts/loader.js"></script>

  <script>
    // Global Utility Functions (Defined once in index.html to be used by all loaded content)

    // Function to format currency (Indian Rupees with Lakhs/Crores)
    function formatIndianCurrency(amount) {
        if (amount === 0) return '₹ 0';
        // Ensure amount is a number before processing
        amount = parseFloat(amount);
        if (isNaN(amount)) return 'N/A';

        // Use Math.abs for positive values before processing
        const absAmount = Math.abs(amount);

        let formattedValue;
        if (absAmount >= 10000000) { // Crores
            formattedValue = `₹ ${Math.round(absAmount / 10000000 * 100) / 100} Crores`;
        } else if (absAmount >= 100000) { // Lakhs
            formattedValue = `₹ ${Math.round(absAmount / 100000 * 100) / 100} Lakhs`;
        } else {
            formattedValue = new Intl.NumberFormat('en-IN', {
                style: 'currency',
                currency: 'INR',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            }).format(absAmount);
        }

        return amount < 0 ? `- ${formattedValue}` : formattedValue; // Add negative sign back if original was negative
    }

    // Function to format raw numbers with commas (e.g., for tooltips in charts)
    function formatNumberWithCommas(value) {
      return value.toLocaleString('en-IN', { maximumFractionDigits: 0 });
    }

    /**
     * Function to update slider value from input (GLOBAL)
     * @param {HTMLElement} slider The range input element.
     * @param {HTMLElement} input The number input element.
     * @param {HTMLElement} displayElement The span to display formatted value.
     * @param {Function} formatter The function to format the value (e.g., formatIndianCurrency).
     * @param {HTMLElement} outputSectionToHide The specific output section to hide (e.g., sipGoalOutput or sipFVOutput).
     */
    function updateSliderFromInput(slider, input, displayElement, formatter, outputSectionToHide) {
        let value = parseFloat(input.value);
        // Clamp value to slider's min/max
        value = Math.max(parseFloat(slider.min), Math.min(parseFloat(slider.max), value));
        slider.value = value;
        displayElement.textContent = formatter(value);
        if (outputSectionToHide) outputSectionToHide.style.display = 'none';
    }

    /**
     * Function to update input value from slider (GLOBAL)
     * @param {HTMLElement} slider The range input element.
     * @param {HTMLElement} input The number input element.
     * @param {HTMLElement} displayElement The span to display formatted value.
     * @param {Function} formatter The function to format the value.
     * @param {HTMLElement} outputSectionToHide The specific output section to hide.
     */
    function updateInputFromSlider(slider, input, displayElement, formatter, outputSectionToHide) {
        input.value = slider.value;
        displayElement.textContent = formatter(parseFloat(slider.value));
        if (outputSectionToHide) outputSectionToHide.style.display = 'none';
    }

    /**
     * Generates a simple confetti effect (GLOBAL)
     * @param {HTMLElement} targetElement The element to attach confetti to.
     * @param {number} count The number of confetti pieces.
     */
    function createConfetti(targetElement, count) {
        // Remove any existing confetti first to prevent accumulation
        document.querySelectorAll('.confetti').forEach(c => c.remove());

        const colors = ['var(--accent-color)', 'var(--primary-color)', '#FFC107', '#FF5722'];
        // Get the bounding rect of the target element relative to the viewport
        const targetRect = targetElement.getBoundingClientRect();

        for (let i = 0; i < count; i++) {
            const confetti = document.createElement('div');
            confetti.classList.add('confetti');
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];

            // Position confetti relative to the target element's top-left corner
            const startX = targetRect.left + (Math.random() * targetRect.width);
            const startY = targetRect.top + (Math.random() * targetRect.height * 0.2); // Start from top 20% of target

            // End positions for falling effect
            const endX = startX + (Math.random() - 0.5) * 400; // Spread horizontally
            const endY = window.innerHeight + 100; // Fall completely off screen

            confetti.style.setProperty('--x', `${startX}px`);
            confetti.style.setProperty('--y', `${startY}px`);
            confetti.style.setProperty('--x-end', `${endX}px`);
            confetti.style.setProperty('--y-end', `${endY}px`);
            confetti.style.animationDuration = `${2 + Math.random() * 2}s`; // 2-4 seconds
            confetti.style.animationDelay = `${Math.random() * 0.5}s`; // Staggered start
            confetti.style.zIndex = 1000; // Ensure it's on top

            document.body.appendChild(confetti);

            confetti.addEventListener('animationend', () => {
                confetti.remove();
            });
        }
    }

    // --- Calculator-Specific Logic (All calculator functions are now here) ---

    // Calculator 1: SIP Required for Future Goal
    function calculateSIPRequired() {
        const goalAmount = parseFloat(document.getElementById('goalAmountInput').value);
        const timeYears = parseFloat(document.getElementById('timeYearsInput').value);
        const expectedReturn = parseFloat(document.getElementById('expectedReturnInput').value);

        if (isNaN(goalAmount) || isNaN(timeYears) || isNaN(expectedReturn) || goalAmount <= 0 || timeYears <= 0 || expectedReturn < 0) {
            alert('Please enter valid positive numbers for all fields.');
            return;
        }

        // Confetti on button click!
        createConfetti(document.getElementById('sipGoalOutput'), 20);

        const monthlyInterestRate = (expectedReturn / 100) / 12;
        const totalMonths = timeYears * 12;

        let sipRequired = 0;
        if (monthlyInterestRate === 0) {
            sipRequired = goalAmount / totalMonths;
        } else {
            sipRequired = goalAmount * (monthlyInterestRate / (Math.pow(1 + monthlyInterestRate, totalMonths) - 1)) / (1 + monthlyInterestRate);
        }

        displaySIPRequiredResult(sipRequired, goalAmount, timeYears, expectedReturn);
    }

    function displaySIPRequiredResult(sipAmount, goalAmount, timeYears, expectedReturn) {
        const outputSection = document.getElementById('sipGoalOutput');
        const sipRequiredAmountDiv = document.getElementById('sipRequiredAmount');
        const outputMessageDiv = document.getElementById('outputMessage');

        sipRequiredAmountDiv.textContent = formatIndianCurrency(sipAmount);
        outputMessageDiv.innerHTML = `To achieve your dream of <strong>${formatIndianCurrency(goalAmount)}</strong> in <strong>${timeYears} years</strong> with an expected return of <strong>${expectedReturn}%</strong>, you need to invest:`;
        outputSection.style.display = 'block';

        google.charts.load('current', {'packages':['corechart']});
        google.charts.setOnLoadCallback(function() {
            drawChartForSIPGoal(sipAmount, goalAmount, timeYears, expectedReturn);
        });
    }

    function drawChartForSIPGoal(sipAmount, goalAmount, timeYears, expectedReturn) {
        const data = new google.visualization.DataTable();
        data.addColumn('number', 'Year');
        data.addColumn('number', 'Your Investment');
        data.addColumn('number', 'Total Corpus (Including Growth)');

        let totalInvested = 0;
        let currentCorpus = 0;
        const monthlyInterestRate = (expectedReturn / 100) / 12;

        const chartData = [];
        chartData.push([0, 0, 0]);

        for (let year = 1; year <= timeYears; year++) {
            for (let month = 1; month <= 12; month++) {
                totalInvested += sipAmount;
                currentCorpus = (currentCorpus + sipAmount) * (1 + monthlyInterestRate);
            }
            chartData.push([year, totalInvested, currentCorpus]);
        }

        data.addRows(chartData);

        const options = {
            title: 'Your Financial Journey: Investment vs. Growth',
            titleTextStyle: { color: '#2C3E50', fontSize: 19, bold: true },
            curveType: 'function',
            legend: { position: 'bottom', textStyle: { color: '#555', fontSize: 12 } },
            hAxis: {
                title: 'Years',
                textStyle: { color: '#555' },
                titleTextStyle: { color: '#444' },
                gridlines: { count: timeYears > 10 ? Math.ceil(timeYears / 5) : timeYears + 1 },
                format: '0'
            },
            vAxis: {
                title: 'Amount (INR)',
                textStyle: { color: '#555' },
                titleTextStyle: { color: '#444' },
                gridlines: { color: '#eee' },
                format: 'short'
            },
            series: {
                0: { color: '#2196F3' },
                1: { color: '#4CAF50' }
            },
            tooltip: {
                isHtml: true,
                trigger: 'focus',
                formatter: function(data, row, col) {
                    const year = data.getValue(row, 0);
                    const invested = data.getValue(row, 1);
                    const corpus = data.getValue(row, 2);
                    return `<div style="padding:10px; font-family: 'Open Sans'; font-size: 14px;">` +
                           `<strong>Year: ${year}</strong><br>` +
                           `<span style="color:#2196F3;">&#9632; Your Investment: ${formatIndianCurrency(invested)}</span><br>` +
                           `<span style="color:#4CAF50;">&#9632; Total Corpus: ${formatIndianCurrency(corpus)}</span>` +
                           `</div>`;
                }
            },
            chartArea: { width: '85%', height: '70%' },
            animation: { duration: 1200, easing: 'out', startup: true },
            backgroundColor: '#fff',
            fontName: 'Open Sans'
        };

        const chart = new google.visualization.LineChart(document.getElementById('chart_div'));
        chart.draw(data, options);
    }

    // Calculator 2: Future Value of SIP
    function calculateFutureValueOfSIP() {
        const sipAmount = parseFloat(document.getElementById('sipAmountInput').value);
        const timeYears = parseFloat(document.getElementById('fvTimeYearsInput').value);
        const expectedReturn = parseFloat(document.getElementById('fvExpectedReturnInput').value);

        if (isNaN(sipAmount) || isNaN(timeYears) || isNaN(expectedReturn) || sipAmount <= 0 || timeYears <= 0 || expectedReturn < 0) {
            alert('Please enter valid positive numbers for all fields.');
            return;
        }

        // Confetti on button click!
        createConfetti(document.getElementById('sipFVOutput'), 20);

        const monthlyInterestRate = (expectedReturn / 100) / 12;
        const totalMonths = timeYears * 12;

        let futureValue = 0;
        if (monthlyInterestRate === 0) {
            futureValue = sipAmount * totalMonths;
        } else {
            futureValue = sipAmount * ((Math.pow(1 + monthlyInterestRate, totalMonths) - 1) / monthlyInterestRate) * (1 + monthlyInterestRate);
        }

        displayFVResult(futureValue, sipAmount, timeYears, expectedReturn);
    }

    function displayFVResult(futureValue, sipAmount, timeYears, expectedReturn) {
        const outputSection = document.getElementById('sipFVOutput');
        const fvCorpusAmountDiv = document.getElementById('fvCorpusAmount');
        const fvOutputMessageDiv = document.getElementById('fvOutputMessage');

        fvCorpusAmountDiv.textContent = formatIndianCurrency(futureValue);
        fvOutputMessageDiv.innerHTML = `With a monthly SIP of <strong>₹ ${new Intl.NumberFormat('en-IN', { useGrouping: true }).format(sipAmount)}</strong> for <strong>${timeYears} years</strong> at <strong>${expectedReturn}%</strong> expected return, your estimated future corpus will be:`;
        outputSection.style.display = 'block';

        google.charts.load('current', {'packages':['corechart']});
        google.charts.setOnLoadCallback(function() {
            drawChartForFV(futureValue, sipAmount, timeYears, expectedReturn);
        });
    }

    function drawChartForFV(futureValue, sipAmount, timeYears, expectedReturn) {
        const data = new google.visualization.DataTable();
        data.addColumn('number', 'Year');
        data.addColumn('number', 'Your Total Investment');
        data.addColumn('number', 'Total Corpus (Incl. Growth)');

        let totalInvested = 0;
        let currentCorpus = 0;
        const monthlyInterestRate = (expectedReturn / 100) / 12;

        const chartData = [];
        chartData.push([0, 0, 0]);

        for (let year = 1; year <= timeYears; year++) {
            for (let month = 1; month <= 12; month++) {
                totalInvested += sipAmount;
                currentCorpus = (currentCorpus + sipAmount) * (1 + monthlyInterestRate);
            }
            chartData.push([year, totalInvested, currentCorpus]);
        }

        data.addRows(chartData);

        const options = {
            title: 'The Magic of Compounding: Your SIP Growth Story',
            titleTextStyle: { color: '#2C3E50', fontSize: 19, bold: true },
            curveType: 'function',
            legend: { position: 'bottom', textStyle: { color: '#555', fontSize: 12 } },
            hAxis: {
                title: 'Years',
                textStyle: { color: '#555' },
                titleTextStyle: { color: '#444' },
                gridlines: { count: timeYears > 10 ? Math.ceil(timeYears / 5) : timeYears + 1 },
                format: '0'
            },
            vAxis: {
                title: 'Amount (INR)',
                textStyle: { color: '#555' },
                titleTextStyle: { color: '#444' },
                gridlines: { color: '#eee' },
                format: 'short'
            },
            series: {
                0: { color: '#2196F3', areaOpacity: 0.3 },
                1: { color: '#4CAF50', areaOpacity: 0.6 }
            },
            isStacked: false,
            tooltip: {
                isHtml: true,
                trigger: 'focus',
                formatter: function(data, row, col) {
                    const year = data.getValue(row, 0);
                    const invested = data.getValue(row, 1);
                    const corpus = data.getValue(row, 2);
                    return `<div style="padding:10px; font-family: 'Open Sans'; font-size: 14px;">` +
                           `<strong>Year: ${year}</strong><br>` +
                           `<span style="color:#2196F3;">&#9632; Your Total Investment: ${formatIndianCurrency(invested)}</span><br>` +
                           `<span style="color:#4CAF50;">&#9632; Total Corpus: ${formatIndianCurrency(corpus)}</span>` +
                           `</div>`;
                }
            },
            chartArea: { width: '85%', height: '70%' },
            animation: { duration: 1200, easing: 'out', startup: true },
            backgroundColor: '#fff',
            fontName: 'Open Sans'
        };

        const chart = new google.visualization.AreaChart(document.getElementById('fv_chart_div'));
        chart.draw(data, options);
    }

    // Calculator 3: Lumpsum Required for Future Goal
    function calculateLumpsumRequired() {
        const goalAmount = parseFloat(document.getElementById('lumpsumGoalAmountInput').value);
        const timeYears = parseFloat(document.getElementById('lumpsumTimeYearsInput').value);
        const expectedReturn = parseFloat(document.getElementById('lumpsumExpectedReturnInput').value);

        if (isNaN(goalAmount) || isNaN(timeYears) || isNaN(expectedReturn) || goalAmount <= 0 || timeYears <= 0 || expectedReturn < 0) {
            alert('Please enter valid positive numbers for all fields.');
            return;
        }

        // Confetti on button click!
        createConfetti(document.getElementById('lumpsumGoalOutput'), 20);

        const annualInterestRate = expectedReturn / 100;
        let lumpsumRequired = 0;

        if (annualInterestRate === 0) {
            lumpsumRequired = goalAmount; // If 0% return, you need the full amount
        } else {
            // PV = FV / (1 + r)^n
            lumpsumRequired = goalAmount / Math.pow(1 + annualInterestRate, timeYears);
        }

        displayLumpsumRequiredResult(lumpsumRequired, goalAmount, timeYears, expectedReturn);
    }

    function displayLumpsumRequiredResult(lumpsumRequired, goalAmount, timeYears, expectedReturn) {
        const outputSection = document.getElementById('lumpsumGoalOutput');
        const lumpsumRequiredAmountDiv = document.getElementById('lumpsumRequiredAmount');
        const outputMessageDiv = document.getElementById('lumpsumOutputMessage');

        lumpsumRequiredAmountDiv.textContent = formatIndianCurrency(lumpsumRequired);
        outputMessageDiv.innerHTML = `To achieve your dream of <strong>${formatIndianCurrency(goalAmount)}</strong> in <strong>${timeYears} years</strong> with an expected return of <strong>${expectedReturn}%</strong>, you need to invest a one-time lump sum of:`;
        outputSection.style.display = 'block';

        google.charts.load('current', {'packages':['corechart']});
        google.charts.setOnLoadCallback(function() {
            drawChartForLumpsumRequired(lumpsumRequired, goalAmount, timeYears, expectedReturn);
        });
    }

    function drawChartForLumpsumRequired(lumpsumRequired, goalAmount, timeYears, expectedReturn) {
        const data = new google.visualization.DataTable();
        data.addColumn('number', 'Year');
        data.addColumn('number', 'Your Investment');
        data.addColumn('number', 'Total Corpus (Including Growth)');

        let currentCorpus = lumpsumRequired;
        const annualInterestRate = expectedReturn / 100;

        const chartData = [];
        chartData.push([0, lumpsumRequired, lumpsumRequired]);

        for (let year = 1; year <= timeYears; year++) {
            currentCorpus *= (1 + annualInterestRate);
            chartData.push([year, lumpsumRequired, currentCorpus]);
        }

        data.addRows(chartData);

        const options = {
            title: 'Your Lumpsum Investment Growth Journey',
            titleTextStyle: { color: '#2C3E50', fontSize: 19, bold: true },
            curveType: 'function',
            legend: { position: 'bottom', textStyle: { color: '#555', fontSize: 12 } },
            hAxis: {
                title: 'Years',
                textStyle: { color: '#555' },
                titleTextStyle: { color: '#444' },
                gridlines: { count: timeYears > 10 ? Math.ceil(timeYears / 5) : timeYears + 1 },
                format: '0'
            },
            vAxis: {
                title: 'Amount (INR)',
                textStyle: { color: '#555' },
                titleTextStyle: { color: '#444' },
                gridlines: { color: '#eee' },
                format: 'short'
            },
            series: {
                0: { color: '#2196F3', areaOpacity: 0.3 },
                1: { color: '#4CAF50', areaOpacity: 0.6 }
            },
            isStacked: false,
            tooltip: {
                isHtml: true,
                trigger: 'focus',
                formatter: function(data, row, col) {
                    const year = data.getValue(row, 0);
                    const invested = data.getValue(row, 1);
                    const corpus = data.getValue(row, 2);
                    return `<div style="padding:10px; font-family: 'Open Sans'; font-size: 14px;">` +
                           `<strong>Year: ${year}</strong><br>` +
                           `<span style="color:#2196F3;">&#9632; Your Investment: ${formatIndianCurrency(invested)}</span><br>` +
                           `<span style="color:#4CAF50;">&#9632; Total Corpus: ${formatIndianCurrency(corpus)}</span>` +
                           `</div>`;
                }
            },
            chartArea: { width: '85%', height: '70%' },
            animation: { duration: 1200, easing: 'out', startup: true },
            backgroundColor: '#fff',
            fontName: 'Open Sans'
        };

        const chart = new google.visualization.LineChart(document.getElementById('lumpsum_chart_div'));
        chart.draw(data, options);
    }

    // Calculator 4: Future Value of Lumpsum
    function calculateFutureValueOfLumpsum() {
        const lumpsumAmount = parseFloat(document.getElementById('fvLumpsumAmountInput').value);
        const timeYears = parseFloat(document.getElementById('fvLumpsumTimeYearsInput').value);
        const expectedReturn = parseFloat(document.getElementById('fvLumpsumExpectedReturnInput').value);

        if (isNaN(lumpsumAmount) || isNaN(timeYears) || isNaN(expectedReturn) || lumpsumAmount <= 0 || timeYears <= 0 || expectedReturn < 0) {
            alert('Please enter valid positive numbers for all fields.');
            return;
        }

        // Confetti on button click!
        createConfetti(document.getElementById('fvLumpsumOutput'), 20);

        const annualInterestRate = expectedReturn / 100;
        let futureValue = lumpsumAmount * Math.pow(1 + annualInterestRate, timeYears);

        displayFutureValueOfLumpsumResult(futureValue, lumpsumAmount, timeYears, expectedReturn);
    }

    function displayFutureValueOfLumpsumResult(futureValue, lumpsumAmount, timeYears, expectedReturn) {
        const outputSection = document.getElementById('fvLumpsumOutput');
        const fvLumpsumCorpusAmountDiv = document.getElementById('fvLumpsumCorpusAmount');
        const fvLumpsumOutputMessageDiv = document.getElementById('fvLumpsumOutputMessage');

        fvLumpsumCorpusAmountDiv.textContent = formatIndianCurrency(futureValue);
        fvLumpsumOutputMessageDiv.innerHTML = `With a one-time investment of <strong>${formatIndianCurrency(lumpsumAmount)}</strong> for <strong>${timeYears} years</strong> at <strong>${expectedReturn}%</strong> expected return, your estimated future corpus will be:`;
        outputSection.style.display = 'block';

        google.charts.load('current', {'packages':['corechart']});
        google.charts.setOnLoadCallback(function() {
            drawChartForFutureValueOfLumpsum(futureValue, lumpsumAmount, timeYears, expectedReturn);
        });
    }

    function drawChartForFutureValueOfLumpsum(futureValue, lumpsumAmount, timeYears, expectedReturn) {
        const data = new google.visualization.DataTable();
        data.addColumn('number', 'Year');
        data.addColumn('number', 'Your Investment');
        data.addColumn('number', 'Total Corpus (Including Growth)');

        let currentCorpus = lumpsumAmount;
        const annualInterestRate = expectedReturn / 100;

        const chartData = [];
        chartData.push([0, lumpsumAmount, lumpsumAmount]);

        for (let year = 1; year <= timeYears; year++) {
            currentCorpus *= (1 + annualInterestRate);
            chartData.push([year, lumpsumAmount, currentCorpus]);
        }

        data.addRows(chartData);

        const options = {
            title: 'Your Lumpsum Investment Growth Story',
            titleTextStyle: { color: '#2C3E50', fontSize: 19, bold: true },
            curveType: 'function',
            legend: { position: 'bottom', textStyle: { color: '#555', fontSize: 12 } },
            hAxis: {
                title: 'Years',
                textStyle: { color: '#555' },
                titleTextStyle: { color: '#444' },
                gridlines: { count: timeYears > 10 ? Math.ceil(timeYears / 5) : timeYears + 1 },
                format: '0'
            },
            vAxis: {
                title: 'Amount (INR)',
                textStyle: { color: '#555' },
                titleTextStyle: { color: '#444' },
                gridlines: { color: '#eee' },
                format: 'short'
            },
            series: {
                0: { color: '#2196F3', areaOpacity: 0.3 },
                1: { color: '#4CAF50', areaOpacity: 0.6 }
            },
            isStacked: false,
            tooltip: {
                isHtml: true,
                trigger: 'focus',
                formatter: function(data, row, col) {
                    const year = data.getValue(row, 0);
                    const invested = data.getValue(row, 1);
                    const corpus = data.getValue(row, 2);
                    return `<div style="padding:10px; font-family: 'Open Sans'; font-size: 14px;">` +
                           `<strong>Year: ${year}</strong><br>` +
                           `<span style="color:#2196F3;">&#9632; Your Investment: ${formatIndianCurrency(invested)}</span><br>` +
                           `<span style="color:#4CAF50;">&#9632; Total Corpus: ${formatIndianCurrency(corpus)}</span>` +
                           `</div>`;
                }
            },
            chartArea: { width: '85%', height: '70%' },
            animation: { duration: 1200, easing: 'out', startup: true },
            backgroundColor: '#fff',
            fontName: 'Open Sans'
        };

        const chart = new google.visualization.AreaChart(document.getElementById('fv_lumpsum_chart_div'));
        chart.draw(data, options);
    }

    // Calculator 5: SWP from Retirement Corpus
    function calculateSWPFromCorpus() {
        const corpusAmount = parseFloat(document.getElementById('swpCorpusAmountInput').value);
        const withdrawalYears = parseFloat(document.getElementById('swpWithdrawalYearsInput').value);
        const expectedReturn = parseFloat(document.getElementById('swpExpectedReturnInput').value);

        if (isNaN(corpusAmount) || isNaN(withdrawalYears) || isNaN(expectedReturn) || corpusAmount <= 0 || withdrawalYears <= 0 || expectedReturn < 0) {
            alert('Please enter valid positive numbers for all fields.');
            return;
        }
        
        // Confetti on button click!
        createConfetti(document.getElementById('swpOutput'), 20);

        const monthlyInterestRate = (expectedReturn / 100) / 12;
        const totalMonths = withdrawalYears * 12;

        let monthlySWP = 0;
        if (monthlyInterestRate === 0) {
            monthlySWP = corpusAmount / totalMonths;
        } else {
            // SWP formula: P * [ i / (1 - (1 + i)^-n) ]
            monthlySWP = corpusAmount * (monthlyInterestRate / (1 - Math.pow(1 + monthlyInterestRate, -totalMonths)));
        }

        displaySWPFromCorpusResult(monthlySWP, corpusAmount, withdrawalYears, expectedReturn);
    }

    function displaySWPFromCorpusResult(monthlySWP, corpusAmount, withdrawalYears, expectedReturn) {
        const outputSection = document.getElementById('swpOutput');
        const swpAmountDiv = document.getElementById('swpAmount');
        const outputMessageDiv = document.getElementById('swpOutputMessage');

        swpAmountDiv.textContent = formatIndianCurrency(monthlySWP);
        outputMessageDiv.innerHTML = `From an initial corpus of <strong>${formatIndianCurrency(corpusAmount)}</strong>, you can withdraw:`;
        outputSection.style.display = 'block';

        google.charts.load('current', {'packages':['corechart']});
        google.charts.setOnLoadCallback(function() {
            drawChartForSWPFromCorpus(monthlySWP, corpusAmount, withdrawalYears, expectedReturn);
        });
    }

    function drawChartForSWPFromCorpus(monthlySWP, corpusAmount, withdrawalYears, expectedReturn) {
        const data = new google.visualization.DataTable();
        data.addColumn('number', 'Year');
        data.addColumn('number', 'Remaining Corpus');

        let currentCorpus = corpusAmount;
        const monthlyInterestRate = (expectedReturn / 100) / 12;

        const chartData = [];
        chartData.push([0, corpusAmount]);

        for (let year = 1; year <= withdrawalYears; year++) {
            for (let month = 1; month <= 12; month++) {
                currentCorpus = currentCorpus * (1 + monthlyInterestRate) - monthlySWP;
                if (currentCorpus < 0) currentCorpus = 0; // Prevent negative corpus on chart
            }
            chartData.push([year, currentCorpus]);
        }

        data.addRows(chartData);

        const options = {
            title: 'Corpus Depletion Over Time (SWP)',
            titleTextStyle: { color: '#2C3E50', fontSize: 19, bold: true },
            curveType: 'function',
            legend: { position: 'bottom', textStyle: { color: '#555', fontSize: 12 } },
            hAxis: {
                title: 'Years',
                textStyle: { color: '#555' },
                titleTextStyle: { color: '#444' },
                gridlines: { count: withdrawalYears > 10 ? Math.ceil(withdrawalYears / 5) : withdrawalYears + 1 },
                format: '0'
            },
            vAxis: {
                title: 'Amount (INR)',
                textStyle: { color: '#555' },
                titleTextStyle: { color: '#444' },
                gridlines: { color: '#eee' },
                format: 'short',
                minValue: 0 // Ensure y-axis starts at 0
            },
            series: {
                0: { color: '#E91E63' } // A distinct color for retirement/withdrawal
            },
            tooltip: {
                isHtml: true,
                trigger: 'focus',
                formatter: function(data, row, col) {
                    const year = data.getValue(row, 0);
                    const corpus = data.getValue(row, 1);
                    return `<div style="padding:10px; font-family: 'Open Sans'; font-size: 14px;">` +
                           `<strong>Year: ${year}</strong><br>` +
                           `<span style="color:#E91E63;">&#9632; Remaining Corpus: ${formatIndianCurrency(corpus)}</span>` +
                           `</div>`;
                }
            },
            chartArea: { width: '85%', height: '70%' },
            animation: { duration: 1200, easing: 'out', startup: true },
            backgroundColor: '#fff',
            fontName: 'Open Sans'
        };

        const chart = new google.visualization.LineChart(document.getElementById('swp_chart_div'));
        chart.draw(data, options);
    }

    // Calculator 6: Corpus Required for SWP
    function calculateCorpusRequiredForSWP() {
        const desiredMonthlySWP = parseFloat(document.getElementById('crfswpMonthlySWPInput').value);
        const withdrawalYears = parseFloat(document.getElementById('crfswpWithdrawalYearsInput').value);
        const expectedReturn = parseFloat(document.getElementById('crfswpExpectedReturnInput').value);

        if (isNaN(desiredMonthlySWP) || isNaN(withdrawalYears) || isNaN(expectedReturn) || desiredMonthlySWP <= 0 || withdrawalYears <= 0 || expectedReturn < 0) {
            alert('Please enter valid positive numbers for all fields.');
            return;
        }

        // Confetti on button click!
        createConfetti(document.getElementById('crfswpOutput'), 20);

        const monthlyInterestRate = (expectedReturn / 100) / 12;
        const totalMonths = withdrawalYears * 12;

        let requiredCorpus = 0;
        if (monthlyInterestRate === 0) {
            requiredCorpus = desiredMonthlySWP * totalMonths;
        } else {
            // Required Corpus formula: PMT * [ (1 - (1 + i)^-n) / i ]
            requiredCorpus = desiredMonthlySWP * ((1 - Math.pow(1 + monthlyInterestRate, -totalMonths)) / monthlyInterestRate);
        }

        displayCorpusRequiredForSWPResult(requiredCorpus, desiredMonthlySWP, withdrawalYears, expectedReturn);
    }

    function displayCorpusRequiredForSWPResult(requiredCorpus, desiredMonthlySWP, withdrawalYears, expectedReturn) {
        const outputSection = document.getElementById('crfswpOutput');
        const requiredCorpusAmountDiv = document.getElementById('requiredCorpusAmount');
        const outputMessageDiv = document.getElementById('crfswpOutputMessage');

        requiredCorpusAmountDiv.textContent = formatIndianCurrency(requiredCorpus);
        outputMessageDiv.innerHTML = `To receive a monthly income of <strong>₹ ${new Intl.NumberFormat('en-IN', { useGrouping: true }).format(desiredMonthlySWP)}</strong> for <strong>${withdrawalYears} years</strong>, you need a retirement corpus of:`;
        outputSection.style.display = 'block';

        google.charts.load('current', {'packages':['corechart']});
        google.charts.setOnLoadCallback(function() {
            drawChartForCorpusRequiredForSWP(requiredCorpus, desiredMonthlySWP, withdrawalYears, expectedReturn);
        });
    }

    function drawChartForCorpusRequiredForSWP(requiredCorpus, desiredMonthlySWP, withdrawalYears, expectedReturn) {
        const data = new google.visualization.DataTable();
        data.addColumn('number', 'Year');
        data.addColumn('number', 'Corpus Value');

        let currentCorpus = requiredCorpus;
        const monthlyInterestRate = (expectedReturn / 100) / 12;

        const chartData = [];
        chartData.push([0, requiredCorpus]);

        for (let year = 1; year <= withdrawalYears; year++) {
            for (let month = 1; month <= 12; month++) {
                currentCorpus = currentCorpus * (1 + monthlyInterestRate) - desiredMonthlySWP;
                if (currentCorpus < 0) currentCorpus = 0;
            }
            chartData.push([year, currentCorpus]);
        }

        data.addRows(chartData);

        const options = {
            title: 'Corpus Value Over Withdrawal Period',
            titleTextStyle: { color: '#2C3E50', fontSize: 19, bold: true },
            curveType: 'function',
            legend: { position: 'bottom', textStyle: { color: '#555', fontSize: 12 } },
            hAxis: {
                title: 'Years',
                textStyle: { color: '#555' },
                titleTextStyle: { color: '#444' },
                gridlines: { count: withdrawalYears > 10 ? Math.ceil(withdrawalYears / 5) : withdrawalYears + 1 },
                format: '0'
            },
            vAxis: {
                title: 'Amount (INR)',
                textStyle: { color: '#555' },
                titleTextStyle: { color: '#444' },
                gridlines: { color: '#eee' },
                format: 'short',
                minValue: 0
            },
            series: {
                0: { color: '#FF9800' } // Orange for required corpus
            },
            tooltip: {
                isHtml: true,
                trigger: 'focus',
                formatter: function(data, row, col) {
                    const year = data.getValue(row, 0);
                    const corpus = data.getValue(row, 1);
                    return `<div style="padding:10px; font-family: 'Open Sans'; font-size: 14px;">` +
                           `<strong>Year: ${year}</strong><br>` +
                           `<span style="color:#FF9800;">&#9632; Corpus Value: ${formatIndianCurrency(corpus)}</span>` +
                           `</div>`;
                }
            },
            chartArea: { width: '85%', height: '70%' },
            animation: { duration: 1200, easing: 'out', startup: true },
            backgroundColor: '#fff',
            fontName: 'Open Sans'
        };

        const chart = new google.visualization.LineChart(document.getElementById('crfswp_chart_div'));
        chart.draw(data, options);
    }

    // Calculator 7: Future Value of Limited Period SIP
    function calculateFVLimitedSIP() {
        const monthlySIP = parseFloat(document.getElementById('fvlsMonthlySIPInput').value);
        const sipPeriodYears = parseFloat(document.getElementById('fvlsSipPeriodInput').value);
        const totalGrowthPeriodYears = parseFloat(document.getElementById('fvlsGrowthPeriodInput').value);
        const expectedReturn = parseFloat(document.getElementById('fvlsExpectedReturnInput').value);

        if (isNaN(monthlySIP) || isNaN(sipPeriodYears) || isNaN(totalGrowthPeriodYears) || isNaN(expectedReturn) ||
            monthlySIP <= 0 || sipPeriodYears <= 0 || totalGrowthPeriodYears < sipPeriodYears || expectedReturn < 0) {
            alert('Please enter valid positive numbers. Total Growth Period must be greater than or equal to SIP Period.');
            return;
        }

        // Confetti on button click!
        createConfetti(document.getElementById('fvlsOutput'), 20);

        const monthlyInterestRate = (expectedReturn / 100) / 12;
        const sipMonths = sipPeriodYears * 12;
        const totalMonths = totalGrowthPeriodYears * 12;

        let corpusAtEndOfSIPPeriod = 0;
        if (monthlyInterestRate === 0) {
            corpusAtEndOfSIPPeriod = monthlySIP * sipMonths;
        } else {
            corpusAtEndOfSIPPeriod = monthlySIP * ((Math.pow(1 + monthlyInterestRate, sipMonths) - 1) / monthlyInterestRate) * (1 + monthlyInterestRate);
        }

        // Now, let this corpus grow for the remaining period
        const remainingGrowthMonths = totalMonths - sipMonths;
        let finalFutureValue = corpusAtEndOfSIPPeriod * Math.pow(1 + monthlyInterestRate, remainingGrowthMonths);

        displayFVLimitedSIPResult(finalFutureValue, monthlySIP, sipPeriodYears, totalGrowthPeriodYears, expectedReturn);
    }

    function displayFVLimitedSIPResult(futureValue, monthlySIP, sipPeriodYears, totalGrowthPeriodYears, expectedReturn) {
        const outputSection = document.getElementById('fvlsOutput');
        const fvlsCorpusAmountDiv = document.getElementById('fvlsCorpusAmount');
        const fvlsOutputMessageDiv = document.getElementById('fvlsOutputMessage');

        fvlsCorpusAmountDiv.textContent = formatIndianCurrency(futureValue);
        fvlsOutputMessageDiv.innerHTML = `With a monthly SIP of <strong>₹ ${new Intl.NumberFormat('en-IN', { useGrouping: true }).format(monthlySIP)}</strong> for <strong>${sipPeriodYears} years</strong>, growing for a total of <strong>${totalGrowthPeriodYears} years</strong> at <strong>${expectedReturn}%</strong>, your estimated future corpus will be:`;
        outputSection.style.display = 'block';

        google.charts.load('current', {'packages':['corechart']});
        google.charts.setOnLoadCallback(function() {
            drawChartForFVLimitedSIP(futureValue, monthlySIP, sipPeriodYears, totalGrowthPeriodYears, expectedReturn);
        });
    }

    function drawChartForFVLimitedSIP(futureValue, monthlySIP, sipPeriodYears, totalGrowthPeriodYears, expectedReturn) {
        const data = new google.visualization.DataTable();
        data.addColumn('number', 'Year');
        data.addColumn('number', 'Your Investment');
        data.addColumn('number', 'Total Corpus (Including Growth)');

        let totalInvested = 0;
        let currentCorpus = 0;
        const monthlyInterestRate = (expectedReturn / 100) / 12;

        const chartData = [];
        chartData.push([0, 0, 0]);

        for (let year = 1; year <= totalGrowthPeriodYears; year++) {
            if (year <= sipPeriodYears) {
                for (let month = 1; month <= 12; month++) {
                    totalInvested += monthlySIP;
                    currentCorpus = (currentCorpus + monthlySIP) * (1 + monthlyInterestRate);
                }
            } else {
                currentCorpus = currentCorpus * Math.pow(1 + monthlyInterestRate, 12); // Compound annually after SIP stops
            }
            chartData.push([year, totalInvested, currentCorpus]);
        }

        data.addRows(chartData);

        const options = {
            title: 'Your Limited SIP Growth Story',
            titleTextStyle: { color: '#2C3E50', fontSize: 19, bold: true },
            curveType: 'function',
            legend: { position: 'bottom', textStyle: { color: '#555', fontSize: 12 } },
            hAxis: {
                title: 'Years',
                textStyle: { color: '#555' },
                titleTextStyle: { color: '#444' },
                gridlines: { count: totalGrowthPeriodYears > 10 ? Math.ceil(totalGrowthPeriodYears / 5) : totalGrowthPeriodYears + 1 },
                format: '0'
            },
            vAxis: {
                title: 'Amount (INR)',
                textStyle: { color: '#555' },
                titleTextStyle: { color: '#444' },
                gridlines: { color: '#eee' },
                format: 'short'
            },
            series: {
                0: { color: '#2196F3', areaOpacity: 0.3 },
                1: { color: '#4CAF50', areaOpacity: 0.6 }
            },
            isStacked: false,
            tooltip: {
                isHtml: true,
                trigger: 'focus',
                formatter: function(data, row, col) {
                    const year = data.getValue(row, 0);
                    const invested = data.getValue(row, 1);
                    const corpus = data.getValue(row, 2);
                    return `<div style="padding:10px; font-family: 'Open Sans'; font-size: 14px;">` +
                           `<strong>Year: ${year}</strong><br>` +
                           `<span style="color:#2196F3;">&#9632; Your Investment: ${formatIndianCurrency(invested)}</span><br>` +
                           `<span style="color:#4CAF50;">&#9632; Total Corpus: ${formatIndianCurrency(corpus)}</span>` +
                           `</div>`;
                }
            },
            chartArea: { width: '85%', height: '70%' },
            animation: { duration: 1200, easing: 'out', startup: true },
            backgroundColor: '#fff',
            fontName: 'Open Sans'
        };

        const chart = new google.visualization.LineChart(document.getElementById('fvls_chart_div'));
        chart.draw(data, options);
    }

    // Calculator 8: Limited SIP Required for Goal
    function calculateLimitedSIPRequired() {
        const goalAmount = parseFloat(document.getElementById('lsrgGoalAmountInput').value);
        const sipPeriodYears = parseFloat(document.getElementById('lsrgSipPeriodInput').value);
        const totalGrowthPeriodYears = parseFloat(document.getElementById('lsrgGrowthPeriodInput').value);
        const expectedReturn = parseFloat(document.getElementById('lsrgExpectedReturnInput').value);

        if (isNaN(goalAmount) || isNaN(sipPeriodYears) || isNaN(totalGrowthPeriodYears) || isNaN(expectedReturn) ||
            goalAmount <= 0 || sipPeriodYears <= 0 || totalGrowthPeriodYears < sipPeriodYears || expectedReturn < 0) {
            alert('Please enter valid positive numbers. Total Growth Period must be greater than or equal to SIP Period.');
            return;
        }

        // Confetti on button click!
        createConfetti(document.getElementById('lsrgOutput'), 20);

        const monthlyInterestRate = (expectedReturn / 100) / 12;
        const sipMonths = sipPeriodYears * 12;
        const totalMonths = totalGrowthPeriodYears * 12;
        const remainingGrowthMonths = totalMonths - sipMonths;

        let sipRequired = 0;

        if (monthlyInterestRate === 0) {
            sipRequired = goalAmount / sipMonths;
        } else {
            // First, calculate the future value of 1 rupee SIP for the SIP period
            const fvOfOneRupeeSIP = ((Math.pow(1 + monthlyInterestRate, sipMonths) - 1) / monthlyInterestRate) * (1 + monthlyInterestRate);
            
            // Then, compound this future value for the remaining growth period
            const compoundedFvOfOneRupeeSIP = fvOfOneRupeeSIP * Math.pow(1 + monthlyInterestRate, remainingGrowthMonths);

            sipRequired = goalAmount / compoundedFvOfOneRupeeSIP;
        }

        displayLimitedSIPRequiredResult(sipRequired, goalAmount, sipPeriodYears, totalGrowthPeriodYears, expectedReturn);
    }

    function displayLimitedSIPRequiredResult(sipAmount, goalAmount, sipPeriodYears, totalGrowthPeriodYears, expectedReturn) {
        const outputSection = document.getElementById('lsrgOutput');
        const lsrgRequiredSIPAmountDiv = document.getElementById('lsrgRequiredSIPAmount');
        const lsrgOutputMessageDiv = document.getElementById('lsrgOutputMessage');

        lsrgRequiredSIPAmountDiv.textContent = formatIndianCurrency(sipAmount);
        lsrgOutputMessageDiv.innerHTML = `To achieve your dream of <strong>${formatIndianCurrency(goalAmount)}</strong> by investing for <strong>${sipPeriodYears} years</strong> and letting it grow for a total of <strong>${totalGrowthPeriodYears} years</strong> at <strong>${expectedReturn}%</strong>, you need to invest:`;
        outputSection.style.display = 'block';

        google.charts.load('current', {'packages':['corechart']});
        google.charts.setOnLoadCallback(function() {
            drawChartForLimitedSIPRequired(sipAmount, goalAmount, sipPeriodYears, totalGrowthPeriodYears, expectedReturn);
        });
    }

    function drawChartForLimitedSIPRequired(sipAmount, goalAmount, sipPeriodYears, totalGrowthPeriodYears, expectedReturn) {
        const data = new google.visualization.DataTable();
        data.addColumn('number', 'Year');
        data.addColumn('number', 'Your Investment');
        data.addColumn('number', 'Total Corpus (Including Growth)');

        let totalInvested = 0;
        let currentCorpus = 0;
        const monthlyInterestRate = (expectedReturn / 100) / 12;

        const chartData = [];
        chartData.push([0, 0, 0]);

        for (let year = 1; year <= totalGrowthPeriodYears; year++) {
            if (year <= sipPeriodYears) {
                for (let month = 1; month <= 12; month++) {
                    totalInvested += sipAmount;
                    currentCorpus = (currentCorpus + sipAmount) * (1 + monthlyInterestRate);
                }
            } else {
                currentCorpus = currentCorpus * Math.pow(1 + monthlyInterestRate, 12);
            }
            chartData.push([year, totalInvested, currentCorpus]);
        }

        data.addRows(chartData);

        const options = {
            title: 'Your Limited SIP Plan to Goal',
            titleTextStyle: { color: '#2C3E50', fontSize: 19, bold: true },
            curveType: 'function',
            legend: { position: 'bottom', textStyle: { color: '#555', fontSize: 12 } },
            hAxis: {
                title: 'Years',
                textStyle: { color: '#555' },
                titleTextStyle: { color: '#444' },
                gridlines: { count: totalGrowthPeriodYears > 10 ? Math.ceil(totalGrowthPeriodYears / 5) : totalGrowthPeriodYears + 1 },
                format: '0'
            },
            vAxis: {
                title: 'Amount (INR)',
                textStyle: { color: '#555' },
                titleTextStyle: { color: '#444' },
                gridlines: { color: '#eee' },
                format: 'short'
            },
            series: {
                0: { color: '#2196F3', areaOpacity: 0.3 },
                1: { color: '#4CAF50', areaOpacity: 0.6 }
            },
            isStacked: false,
            tooltip: {
                isHtml: true,
                trigger: 'focus',
                formatter: function(data, row, col) {
                    const year = data.getValue(row, 0);
                    const invested = data.getValue(row, 1);
                    const corpus = data.getValue(row, 2);
                    return `<div style="padding:10px; font-family: 'Open Sans'; font-size: 14px;">` +
                           `<strong>Year: ${year}</strong><br>` +
                           `<span style="color:#2196F3;">&#9632; Your Investment: ${formatIndianCurrency(invested)}</span><br>` +
                           `<span style="color:#4CAF50;">&#9632; Total Corpus: ${formatIndianCurrency(corpus)}</span>` +
                           `</div>`;
                }
            },
            chartArea: { width: '85%', height: '70%' },
            animation: { duration: 1200, easing: 'out', startup: true },
            backgroundColor: '#fff',
            fontName: 'Open Sans'
        };

        const chart = new google.visualization.LineChart(document.getElementById('lsrg_chart_div'));
        chart.draw(data, options);
    }

    // Calculator 9: Future Value of SIP + One-Time
    function calculateFVSIPOneTime() {
        const monthlySIP = parseFloat(document.getElementById('fvsotMonthlySIPInput').value);
        const lumpsumAmount = parseFloat(document.getElementById('fvsotLumpsumAmountInput').value);
        const timeYears = parseFloat(document.getElementById('fvsotTimeYearsInput').value);
        const expectedReturn = parseFloat(document.getElementById('fvsotExpectedReturnInput').value);

        if (isNaN(monthlySIP) || isNaN(lumpsumAmount) || isNaN(timeYears) || isNaN(expectedReturn) ||
            monthlySIP <= 0 || lumpsumAmount <= 0 || timeYears <= 0 || expectedReturn < 0) {
            alert('Please enter valid positive numbers for all fields.');
            return;
        }

        // Confetti on button click!
        createConfetti(document.getElementById('fvsotOutput'), 20);

        const monthlyInterestRate = (expectedReturn / 100) / 12;
        const annualInterestRate = expectedReturn / 100;
        const totalMonths = timeYears * 12;

        let fvSIP = 0;
        if (monthlyInterestRate === 0) {
            fvSIP = monthlySIP * totalMonths;
        } else {
            fvSIP = monthlySIP * ((Math.pow(1 + monthlyInterestRate, totalMonths) - 1) / monthlyInterestRate) * (1 + monthlyInterestRate);
        }

        let fvLumpsum = lumpsumAmount * Math.pow(1 + annualInterestRate, timeYears);

        const combinedFutureValue = fvSIP + fvLumpsum;

        displayFVSIPOneTimeResult(combinedFutureValue, monthlySIP, lumpsumAmount, timeYears, expectedReturn);
    }

    function displayFVSIPOneTimeResult(combinedFutureValue, monthlySIP, lumpsumAmount, timeYears, expectedReturn) {
        const outputSection = document.getElementById('fvsotOutput');
        const fvsotCorpusAmountDiv = document.getElementById('fvsotCorpusAmount');
        const fvsotOutputMessageDiv = document.getElementById('fvsotOutputMessage');

        fvsotCorpusAmountDiv.textContent = formatIndianCurrency(combinedFutureValue);
        fvsotOutputMessageDiv.innerHTML = `With a monthly SIP of <strong>₹ ${new Intl.NumberFormat('en-IN', { useGrouping: true }).format(monthlySIP)}</strong> and a one-time investment of <strong>${formatIndianCurrency(lumpsumAmount)}</strong> for <strong>${timeYears} years</strong> at <strong>${expectedReturn}%</strong>, your estimated future corpus will be:`;
        outputSection.style.display = 'block';

        google.charts.load('current', {'packages':['corechart']});
        google.charts.setOnLoadCallback(function() {
            drawChartForFVSIPOneTime(combinedFutureValue, monthlySIP, lumpsumAmount, timeYears, expectedReturn);
        });
    }

    function drawChartForFVSIPOneTime(combinedFutureValue, monthlySIP, lumpsumAmount, timeYears, expectedReturn) {
        const data = new google.visualization.DataTable();
        data.addColumn('number', 'Year');
        data.addColumn('number', 'Total Investment');
        data.addColumn('number', 'Total Corpus (Including Growth)');

        let totalInvested = lumpsumAmount; // Initial lump sum
        let currentCorpus = lumpsumAmount; // Initial lump sum
        const monthlyInterestRate = (expectedReturn / 100) / 12;

        const chartData = [];
        chartData.push([0, lumpsumAmount, lumpsumAmount]);

        for (let year = 1; year <= timeYears; year++) {
            for (let month = 1; month <= 12; month++) {
                totalInvested += monthlySIP;
                currentCorpus = (currentCorpus + monthlySIP) * (1 + monthlyInterestRate);
            }
            chartData.push([year, totalInvested, currentCorpus]);
        }

        data.addRows(chartData);

        const options = {
            title: 'Combined Investment Growth Story',
            titleTextStyle: { color: '#2C3E50', fontSize: 19, bold: true },
            curveType: 'function',
            legend: { position: 'bottom', textStyle: { color: '#555', fontSize: 12 } },
            hAxis: {
                title: 'Years',
                textStyle: { color: '#555' },
                titleTextStyle: { color: '#444' },
                gridlines: { count: timeYears > 10 ? Math.ceil(timeYears / 5) : timeYears + 1 },
                format: '0'
            },
            vAxis: {
                title: 'Amount (INR)',
                textStyle: { color: '#555' },
                titleTextStyle: { color: '#444' },
                gridlines: { color: '#eee' },
                format: 'short'
            },
            series: {
                0: { color: '#2196F3', areaOpacity: 0.3 },
                1: { color: '#4CAF50', areaOpacity: 0.6 }
            },
            isStacked: false,
            tooltip: {
                isHtml: true,
                trigger: 'focus',
                formatter: function(data, row, col) {
                    const year = data.getValue(row, 0);
                    const invested = data.getValue(row, 1);
                    const corpus = data.getValue(row, 2);
                    return `<div style="padding:10px; font-family: 'Open Sans'; font-size: 14px;">` +
                           `<strong>Year: ${year}</strong><br>` +
                           `<span style="color:#2196F3;">&#9632; Total Investment: ${formatIndianCurrency(invested)}</span><br>` +
                           `<span style="color:#4CAF50;">&#9632; Total Corpus: ${formatIndianCurrency(corpus)}</span>` +
                           `</div>`;
                }
            },
            chartArea: { width: '85%', height: '70%' },
            animation: { duration: 1200, easing: 'out', startup: true },
            backgroundColor: '#fff',
            fontName: 'Open Sans'
        };

        const chart = new google.visualization.AreaChart(document.getElementById('fvsot_chart_div'));
        chart.draw(data, options);
    }

    // Calculator 10: One-Time Required (if SIP known)
    function calculateOneTimeRequiredIfSIPKnown() {
        const goalAmount = parseFloat(document.getElementById('otrsikGoalAmountInput').value);
        const monthlySIP = parseFloat(document.getElementById('otrsikMonthlySIPInput').value);
        const timeYears = parseFloat(document.getElementById('otrsikTimeYearsInput').value);
        const expectedReturn = parseFloat(document.getElementById('otrsikExpectedReturnInput').value);

        if (isNaN(goalAmount) || isNaN(monthlySIP) || isNaN(timeYears) || isNaN(expectedReturn) ||
            goalAmount <= 0 || monthlySIP <= 0 || timeYears <= 0 || expectedReturn < 0) {
            alert('Please enter valid positive numbers for all fields.');
            return;
        }

        // Confetti on button click!
        createConfetti(document.getElementById('otrsikOutput'), 20);

        const monthlyInterestRate = (expectedReturn / 100) / 12;
        const annualInterestRate = expectedReturn / 100;
        const totalMonths = timeYears * 12;

        let fvSIP = 0;
        if (monthlyInterestRate === 0) {
            fvSIP = monthlySIP * totalMonths;
        } else {
            fvSIP = monthlySIP * ((Math.pow(1 + monthlyInterestRate, totalMonths) - 1) / monthlyInterestRate) * (1 + monthlyInterestRate);
        }

        const remainingAmountNeeded = goalAmount - fvSIP;
        let requiredOneTimeLumpsum = 0;

        if (remainingAmountNeeded <= 0) {
            requiredOneTimeLumpsum = 0; // Goal already met or exceeded by SIP
        } else if (annualInterestRate === 0) {
            requiredOneTimeLumpsum = remainingAmountNeeded;
        } else {
            requiredOneTimeLumpsum = remainingAmountNeeded / Math.pow(1 + annualInterestRate, timeYears);
        }
        
        displayOneTimeRequiredIfSIPKnownResult(requiredOneTimeLumpsum, goalAmount, monthlySIP, timeYears, expectedReturn);
    }

    function displayOneTimeRequiredIfSIPKnownResult(requiredOneTimeLumpsum, goalAmount, monthlySIP, timeYears, expectedReturn) {
        const outputSection = document.getElementById('otrsikOutput');
        const otrsikRequiredLumpsumAmountDiv = document.getElementById('otrsikRequiredLumpsumAmount');
        const otrsikOutputMessageDiv = document.getElementById('otrsikOutputMessage');

        otrsikRequiredLumpsumAmountDiv.textContent = formatIndianCurrency(requiredOneTimeLumpsum);
        otrsikOutputMessageDiv.innerHTML = `To achieve your goal of <strong>${formatIndianCurrency(goalAmount)}</strong> with an ongoing monthly SIP of <strong>₹ ${new Intl.NumberFormat('en-IN', { useGrouping: true }).format(monthlySIP)}</strong> over <strong>${timeYears} years</strong> at <strong>${expectedReturn}%</strong>, you need an additional one-time investment of:`;
        outputSection.style.display = 'block';

        google.charts.load('current', {'packages':['corechart']});
        google.charts.setOnLoadCallback(function() {
            drawChartForOneTimeRequiredIfSIPKnown(requiredOneTimeLumpsum, goalAmount, monthlySIP, timeYears, expectedReturn);
        });
    }

    function drawChartForOneTimeRequiredIfSIPKnown(requiredOneTimeLumpsum, goalAmount, monthlySIP, timeYears, expectedReturn) {
        const data = new google.visualization.DataTable();
        data.addColumn('number', 'Year');
        data.addColumn('number', 'SIP Investment');
        data.addColumn('number', 'Lumpsum Investment');
        data.addColumn('number', 'Total Corpus (Including Growth)');

        let totalSipInvested = 0;
        let currentSipCorpus = 0;
        let currentLumpsumCorpus = requiredOneTimeLumpsum;
        const monthlyInterestRate = (expectedReturn / 100) / 12;
        const annualInterestRate = expectedReturn / 100;

        const chartData = [];
        chartData.push([0, 0, requiredOneTimeLumpsum, requiredOneTimeLumpsum]);

        for (let year = 1; year <= timeYears; year++) {
            for (let month = 1; month <= 12; month++) {
                totalSipInvested += monthlySIP;
                currentSipCorpus = (currentSipCorpus + monthlySIP) * (1 + monthlyInterestRate);
            }
            currentLumpsumCorpus *= (1 + annualInterestRate); // Lumpsum compounds annually
            chartData.push([year, totalSipInvested, requiredOneTimeLumpsum, currentSipCorpus + currentLumpsumCorpus]);
        }

        data.addRows(chartData);

        const options = {
            title: 'Your Combined Path to Goal',
            titleTextStyle: { color: '#2C3E50', fontSize: 19, bold: true },
            curveType: 'function',
            legend: { position: 'bottom', textStyle: { color: '#555', fontSize: 12 } },
            hAxis: {
                title: 'Years',
                textStyle: { color: '#555' },
                titleTextStyle: { color: '#444' },
                gridlines: { count: timeYears > 10 ? Math.ceil(timeYears / 5) : timeYears + 1 },
                format: '0'
            },
            vAxis: {
                title: 'Amount (INR)',
                textStyle: { color: '#555' },
                titleTextStyle: { color: '#444' },
                gridlines: { color: '#eee' },
                format: 'short'
            },
            series: {
                0: { color: '#2196F3', areaOpacity: 0.3 }, // SIP
                1: { color: '#FFC107', areaOpacity: 0.3 }, // Lumpsum
                2: { color: '#4CAF50', areaOpacity: 0.6 } // Total Corpus
            },
            isStacked: false,
            tooltip: {
                isHtml: true,
                trigger: 'focus',
                formatter: function(data, row, col) {
                    const year = data.getValue(row, 0);
                    const sipInv = data.getValue(row, 1);
                    const lumpsumInv = data.getValue(row, 2);
                    const totalCorpus = data.getValue(row, 3);
                    return `<div style="padding:10px; font-family: 'Open Sans'; font-size: 14px;">` +
                           `<strong>Year: ${year}</strong><br>` +
                           `<span style="color:#2196F3;">&#9632; Total SIP Invested: ${formatIndianCurrency(sipInv)}</span><br>` +
                           `<span style="color:#FFC107;">&#9632; Lumpsum Invested: ${formatIndianCurrency(lumpsumInv)}</span><br>` +
                           `<span style="color:#4CAF50;">&#9632; Total Corpus: ${formatIndianCurrency(totalCorpus)}</span>` +
                           `</div>`;
                }
            },
            chartArea: { width: '85%', height: '70%' },
            animation: { duration: 1200, easing: 'out', startup: true },
            backgroundColor: '#fff',
            fontName: 'Open Sans'
        };

        const chart = new google.visualization.LineChart(document.getElementById('otrsik_chart_div'));
        chart.draw(data, options);
    }

    // Calculator 11: SIP Required (if One-Time known)
    function calculateSIPRequiredIfOneTimeKnown() {
        const goalAmount = parseFloat(document.getElementById('sriotkGoalAmountInput').value);
        const lumpsumAmount = parseFloat(document.getElementById('sriotkLumpsumAmountInput').value);
        const timeYears = parseFloat(document.getElementById('sriotkTimeYearsInput').value);
        const expectedReturn = parseFloat(document.getElementById('sriotkExpectedReturnInput').value);

        if (isNaN(goalAmount) || isNaN(lumpsumAmount) || isNaN(timeYears) || isNaN(expectedReturn) ||
            goalAmount <= 0 || lumpsumAmount <= 0 || timeYears <= 0 || expectedReturn < 0) {
            alert('Please enter valid positive numbers for all fields.');
            return;
        }

        // Confetti on button click!
        createConfetti(document.getElementById('sriotkOutput'), 20);

        const monthlyInterestRate = (expectedReturn / 100) / 12;
        const annualInterestRate = expectedReturn / 100;
        const totalMonths = timeYears * 12;

        // Calculate future value of existing lump sum
        const fvLumpsum = lumpsumAmount * Math.pow(1 + annualInterestRate, timeYears);

        const remainingAmountNeededForSIP = goalAmount - fvLumpsum;
        let requiredMonthlySIP = 0;

        if (remainingAmountNeededForSIP <= 0) {
            requiredMonthlySIP = 0; // Goal already met or exceeded by lump sum
        } else if (monthlyInterestRate === 0) {
            requiredMonthlySIP = remainingAmountNeededForSIP / totalMonths;
        } else {
            requiredMonthlySIP = remainingAmountNeededForSIP * (monthlyInterestRate / (Math.pow(1 + monthlyInterestRate, totalMonths) - 1)) / (1 + monthlyInterestRate);
        }

        displaySIPRequiredIfOneTimeKnownResult(requiredMonthlySIP, goalAmount, lumpsumAmount, timeYears, expectedReturn);
    }

    function displaySIPRequiredIfOneTimeKnownResult(requiredMonthlySIP, goalAmount, lumpsumAmount, timeYears, expectedReturn) {
        const outputSection = document.getElementById('sriotkOutput');
        const sriotkRequiredSIPAmountDiv = document.getElementById('sriotkRequiredSIPAmount');
        const sriotkOutputMessageDiv = document.getElementById('sriotkOutputMessage');

        sriotkRequiredSIPAmountDiv.textContent = formatIndianCurrency(requiredMonthlySIP);
        sriotkOutputMessageDiv.innerHTML = `To achieve your goal of <strong>${formatIndianCurrency(goalAmount)}</strong> with an existing one-time investment of <strong>${formatIndianCurrency(lumpsumAmount)}</strong> over <strong>${timeYears} years</strong> at <strong>${expectedReturn}%</strong>, you need an additional monthly SIP of:`;
        outputSection.style.display = 'block';

        google.charts.load('current', {'packages':['corechart']});
        google.charts.setOnLoadCallback(function() {
            drawChartForSIPRequiredIfOneTimeKnown(requiredMonthlySIP, goalAmount, lumpsumAmount, timeYears, expectedReturn);
        });
    }

    function drawChartForSIPRequiredIfOneTimeKnown(requiredMonthlySIP, goalAmount, lumpsumAmount, timeYears, expectedReturn) {
        const data = new google.visualization.DataTable();
        data.addColumn('number', 'Year');
        data.addColumn('number', 'Lumpsum Investment');
        data.addColumn('number', 'SIP Investment');
        data.addColumn('number', 'Total Corpus (Including Growth)');

        let totalSipInvested = 0;
        let currentSipCorpus = 0;
        let currentLumpsumCorpus = lumpsumAmount;
        const monthlyInterestRate = (expectedReturn / 100) / 12;
        const annualInterestRate = expectedReturn / 100;

        const chartData = [];
        chartData.push([0, lumpsumAmount, 0, lumpsumAmount]);

        for (let year = 1; year <= timeYears; year++) {
            for (let month = 1; month <= 12; month++) {
                totalSipInvested += requiredMonthlySIP;
                currentSipCorpus = (currentSipCorpus + requiredMonthlySIP) * (1 + monthlyInterestRate);
            }
            currentLumpsumCorpus *= (1 + annualInterestRate); // Lumpsum compounds annually
            chartData.push([year, lumpsumAmount, totalSipInvested, currentSipCorpus + currentLumpsumCorpus]);
        }

        data.addRows(chartData);

        const options = {
            title: 'Your Combined Path to Goal',
            titleTextStyle: { color: '#2C3E50', fontSize: 19, bold: true },
            curveType: 'function',
            legend: { position: 'bottom', textStyle: { color: '#555', fontSize: 12 } },
            hAxis: {
                title: 'Years',
                textStyle: { color: '#555' },
                titleTextStyle: { color: '#444' },
                gridlines: { count: timeYears > 10 ? Math.ceil(timeYears / 5) : timeYears + 1 },
                format: '0'
            },
            vAxis: {
                title: 'Amount (INR)',
                textStyle: { color: '#555' },
                titleTextStyle: { color: '#444' },
                gridlines: { color: '#eee' },
                format: 'short'
            },
            series: {
                0: { color: '#FFC107', areaOpacity: 0.3 }, // Lumpsum
                1: { color: '#2196F3', areaOpacity: 0.3 }, // SIP
                2: { color: '#4CAF50', areaOpacity: 0.6 } // Total Corpus
            },
            isStacked: false,
            tooltip: {
                isHtml: true,
                trigger: 'focus',
                formatter: function(data, row, col) {
                    const year = data.getValue(row, 0);
                    const lumpsumInv = data.getValue(row, 1);
                    const sipInv = data.getValue(row, 2);
                    const totalCorpus = data.getValue(row, 3);
                    return `<div style="padding:10px; font-family: 'Open Sans'; font-size: 14px;">` +
                           `<strong>Year: ${year}</strong><br>` +
                           `<span style="color:#FFC107;">&#9632; Lumpsum Invested: ${formatIndianCurrency(lumpsumInv)}</span><br>` +
                           `<span style="color:#2196F3;">&#9632; Total SIP Invested: ${formatIndianCurrency(sipInv)}</span><br>` +
                           `<span style="color:#4CAF50;">&#9632; Total Corpus: ${formatIndianCurrency(totalCorpus)}</span>` +
                           `</div>`;
                }
            },
            chartArea: { width: '85%', height: '70%' },
            animation: { duration: 1200, easing: 'out', startup: true },
            backgroundColor: '#fff',
            fontName: 'Open Sans'
        };

        const chart = new google.visualization.LineChart(document.getElementById('sriotk_chart_div'));
        chart.draw(data, options);
    }

    // Calculator 12: Inflation-Adjusted SWP Calculator
    function calculateInflationAdjustedSWP() {
        const initialCorpus = parseFloat(document.getElementById('iaswpCorpusAmountInput').value);
        const withdrawalYears = parseFloat(document.getElementById('iaswpWithdrawalYearsInput').value);
        const expectedReturn = parseFloat(document.getElementById('iaswpExpectedReturnInput').value);
        const inflationRate = parseFloat(document.getElementById('iaswpInflationRateInput').value);

        if (isNaN(initialCorpus) || isNaN(withdrawalYears) || isNaN(expectedReturn) || isNaN(inflationRate) ||
            initialCorpus <= 0 || withdrawalYears <= 0 || expectedReturn < 0 || inflationRate < 0) {
            alert('Please enter valid positive numbers for all fields.');
            return;
        }

        // Confetti on button click!
        createConfetti(document.getElementById('iaswpOutput'), 20);

        const monthlyReturnRate = (expectedReturn / 100) / 12;
        const monthlyInflationRate = (inflationRate / 100) / 12;
        const totalMonths = withdrawalYears * 12;

        let initialMonthlySWP = 0;

        if (expectedReturn === inflationRate) { // Special case: real return is 0%
            initialMonthlySWP = initialCorpus / totalMonths;
        } else {
            const realReturnRate = ((1 + (expectedReturn / 100)) / (1 + (inflationRate / 100))) - 1;
            const realMonthlyReturnRate = (Math.pow(1 + realReturnRate, 1/12)) - 1;

            if (realMonthlyReturnRate === 0) { // If real monthly return is effectively zero
                initialMonthlySWP = initialCorpus / totalMonths;
            } else {
                initialMonthlySWP = initialCorpus * (realMonthlyReturnRate / (1 - Math.pow(1 + realMonthlyReturnRate, -totalMonths)));
            }
        }

        displayInflationAdjustedSWPResult(initialMonthlySWP, initialCorpus, withdrawalYears, expectedReturn, inflationRate);
    }

    function displayInflationAdjustedSWPResult(initialMonthlySWP, initialCorpus, withdrawalYears, expectedReturn, inflationRate) {
        const outputSection = document.getElementById('iaswpOutput');
        const iaswpMonthlySWPAmountDiv = document.getElementById('iaswpMonthlySWPAmount');
        const iaswpOutputMessageDiv = document.getElementById('iaswpOutputMessage');

        iaswpMonthlySWPAmountDiv.textContent = formatIndianCurrency(initialMonthlySWP);
        iaswpOutputMessageDiv.innerHTML = `From an initial corpus of <strong>${formatIndianCurrency(initialCorpus)}</strong>, you can start with a monthly withdrawal of:`;
        outputSection.style.display = 'block';

        google.charts.load('current', {'packages':['corechart']});
        google.charts.setOnLoadCallback(function() {
            drawChartForInflationAdjustedSWP(initialMonthlySWP, initialCorpus, withdrawalYears, expectedReturn, inflationRate);
        });
    }

    function drawChartForInflationAdjustedSWP(initialMonthlySWP, initialCorpus, withdrawalYears, expectedReturn, inflationRate) {
        const data = new google.visualization.DataTable();
        data.addColumn('number', 'Year');
        data.addColumn('number', 'Remaining Corpus');
        data.addColumn('number', 'Annual Withdrawal (Nominal)');

        let currentCorpus = initialCorpus;
        let currentMonthlySWP = initialMonthlySWP;
        const monthlyReturnRate = (expectedReturn / 100) / 12;
        const monthlyInflationRate = (inflationRate / 100) / 12;

        const chartData = [];
        chartData.push([0, initialCorpus, 0]); // Year 0, initial corpus, 0 withdrawal

        for (let year = 1; year <= withdrawalYears; year++) {
            let annualWithdrawalNominal = 0;
            for (let month = 1; month <= 12; month++) {
                currentCorpus = currentCorpus * (1 + monthlyReturnRate) - currentMonthlySWP;
                annualWithdrawalNominal += currentMonthlySWP;
                if (currentCorpus < 0) currentCorpus = 0;
                // Adjust SWP for inflation for the next month's withdrawal
                if (month < 12) { // Don't adjust after the last month of the year
                    currentMonthlySWP *= (1 + monthlyInflationRate);
                }
            }
            chartData.push([year, currentCorpus, annualWithdrawalNominal]);
            // Reset monthly SWP for next year's first month based on initial SWP and accumulated inflation
            currentMonthlySWP = initialMonthlySWP * Math.pow(1 + monthlyInflationRate, year * 12);
        }

        data.addRows(chartData);

        const options = {
            title: 'Inflation-Adjusted SWP: Corpus & Withdrawal Over Time',
            titleTextStyle: { color: '#2C3E50', fontSize: 19, bold: true },
            curveType: 'function',
            legend: { position: 'bottom', textStyle: { color: '#555', fontSize: 12 } },
            hAxis: {
                title: 'Years',
                textStyle: { color: '#555' },
                titleTextStyle: { color: '#444' },
                gridlines: { count: withdrawalYears > 10 ? Math.ceil(withdrawalYears / 5) : withdrawalYears + 1 },
                format: '0'
            },
            vAxis: {
                title: 'Amount (INR)',
                textStyle: { color: '#555' },
                titleTextStyle: { color: '#444' },
                gridlines: { color: '#eee' },
                format: 'short',
                minValue: 0
            },
            series: {
                0: { color: '#E91E63' }, // Remaining Corpus
                1: { color: '#00BCD4' }  // Annual Withdrawal (a new distinct color)
            },
            tooltip: {
                isHtml: true,
                trigger: 'focus',
                formatter: function(data, row, col) {
                    const year = data.getValue(row, 0);
                    const corpus = data.getValue(row, 1);
                    const withdrawal = data.getValue(row, 2);
                    return `<div style="padding:10px; font-family: 'Open Sans'; font-size: 14px;">` +
                           `<strong>Year: ${year}</strong><br>` +
                           `<span style="color:#E91E63;">&#9632; Remaining Corpus: ${formatIndianCurrency(corpus)}</span><br>` +
                           `<span style="color:#00BCD4;">&#9632; Annual Withdrawal: ${formatIndianCurrency(withdrawal)}</span>` +
                           `</div>`;
                }
            },
            chartArea: { width: '85%', height: '70%' },
            animation: { duration: 1200, easing: 'out', startup: true },
            backgroundColor: '#fff',
            fontName: 'Open Sans'
        };

        const chart = new google.visualization.LineChart(document.getElementById('iaswp_chart_div'));
        chart.draw(data, options);
    }

    // Calculator 13: Retirement Shortfall/Surplus Analysis
    function calculateRetirementAnalysis() {
        const currentCorpus = parseFloat(document.getElementById('rsaCurrentCorpusInput').value);
        const monthlySIP = parseFloat(document.getElementById('rsaMonthlySIPInput').value); // NEW INPUT
        const yearsToRetirement = parseFloat(document.getElementById('rsaYearsToRetirementInput').value);
        const desiredMonthlyIncome = parseFloat(document.getElementById('rsaDesiredMonthlyIncomeInput').value);
        const retirementDurationYears = parseFloat(document.getElementById('rsaRetirementDurationInput').value);
        const expectedReturnPreRetirement = parseFloat(document.getElementById('rsaReturnPreRetirementInput').value);
        const expectedReturnPostRetirement = parseFloat(document.getElementById('rsaReturnPostRetirementInput').value);
        const inflationRate = parseFloat(document.getElementById('rsaInflationRateInput').value);
        const lumpsumWithdrawalsStr = document.getElementById('rsaLumpsumWithdrawalsInput').value; // NEW INPUT

        if (isNaN(currentCorpus) || isNaN(monthlySIP) || isNaN(yearsToRetirement) || isNaN(desiredMonthlyIncome) || isNaN(retirementDurationYears) ||
            isNaN(expectedReturnPreRetirement) || isNaN(expectedReturnPostRetirement) || isNaN(inflationRate) ||
            currentCorpus < 0 || monthlySIP < 0 || yearsToRetirement < 0 || desiredMonthlyIncome <= 0 || retirementDurationYears <= 0 ||
            expectedReturnPreRetirement < 0 || expectedReturnPostRetirement < 0 || inflationRate < 0) {
            alert('Please enter valid positive numbers for all fields. Current Corpus and Monthly SIP can be 0.');
            return;
        }

        // Confetti on button click!
        createConfetti(document.getElementById('rsaOutput'), 20);

        // 1. Project Corpus at Retirement (Pre-Retirement Growth)
        const annualReturnPre = expectedReturnPreRetirement / 100;
        const monthlyReturnPre = annualReturnPre / 12;
        const totalMonthsPre = yearsToRetirement * 12;

        let projectedCorpusAtRetirement = 0;

        // FV of initial lumpsum
        projectedCorpusAtRetirement += currentCorpus * Math.pow(1 + annualReturnPre, yearsToRetirement);

        // FV of SIP
        if (monthlyReturnPre === 0) {
            projectedCorpusAtRetirement += monthlySIP * totalMonthsPre;
        } else {
            projectedCorpusAtRetirement += monthlySIP * ((Math.pow(1 + monthlyReturnPre, totalMonthsPre) - 1) / monthlyReturnPre) * (1 + monthlyReturnPre);
        }
        
        // 2. Calculate Required Corpus at Retirement (considering inflation and post-retirement returns)
        const annualInflation = inflationRate / 100;
        const monthlyReturnPost = (expectedReturnPostRetirement / 100) / 12;
        const monthlyInflationRate = (inflationRate / 100) / 12;
        const totalRetirementMonths = retirementDurationYears * 12;

        // Desired monthly income in future value (at retirement start)
        let desiredMonthlyIncomeAtRetirement = desiredMonthlyIncome * Math.pow(1 + annualInflation, yearsToRetirement);

        let pvIncome = 0;
        if (expectedReturnPostRetirement === inflationRate) { // Real return is 0%
            pvIncome = desiredMonthlyIncomeAtRetirement * totalRetirementMonths;
        } else {
            const realReturnRatePost = ((1 + (expectedReturnPostRetirement / 100)) / (1 + (inflationRate / 100))) - 1;
            const realMonthlyReturnRatePost = (Math.pow(1 + realReturnRatePost, 1/12)) - 1; // Convert annual real rate to monthly real rate

            if (realMonthlyReturnRatePost === 0) {
                pvIncome = desiredMonthlyIncomeAtRetirement * totalRetirementMonths;
            } else {
                pvIncome = desiredMonthlyIncomeAtRetirement * ((1 - Math.pow(1 + realMonthlyReturnRatePost, -totalRetirementMonths)) / realMonthlyReturnRatePost);
            }
        }

        let pvLumpsumWithdrawals = 0;
        const withdrawalsArray = lumpsumWithdrawalsStr.split(',').map(s => s.trim()).filter(s => s.length > 0);
        
        withdrawalsArray.forEach(item => {
            const parts = item.split('@');
            if (parts.length === 2) {
                const amount = parseFloat(parts[0]);
                const year = parseFloat(parts[1]);
                if (!isNaN(amount) && !isNaN(year) && amount > 0 && year > 0 && year <= retirementDurationYears) {
                    // Adjust withdrawal amount for inflation to the year of withdrawal (relative to retirement start)
                    const inflationAdjustedAmount = amount * Math.pow(1 + annualInflation, year);
                    // Discount this inflation-adjusted amount back to retirement start
                    pvLumpsumWithdrawals += inflationAdjustedAmount / Math.pow(1 + (expectedReturnPostRetirement / 100), year); // Use nominal post-retirement return for discounting
                }
            }
        });

        const requiredCorpusAtRetirement = pvIncome + pvLumpsumWithdrawals;

        const shortfallOrSurplus = projectedCorpusAtRetirement - requiredCorpusAtRetirement;

        displayRetirementAnalysisResult(projectedCorpusAtRetirement, requiredCorpusAtRetirement, shortfallOrSurplus, desiredMonthlyIncomeAtRetirement, yearsToRetirement, retirementDurationYears);
    }

    function displayRetirementAnalysisResult(projectedCorpus, requiredCorpus, shortfallOrSurplus, desiredMonthlyIncomeAtRetirement, yearsToRetirement, retirementDurationYears) {
        const outputSection = document.getElementById('rsaOutput');
        const rsaProjectedCorpusDiv = document.getElementById('rsaProjectedCorpus');
        const rsaRequiredCorpusDiv = document.getElementById('rsaRequiredCorpus');
        const rsaShortfallSurplusDiv = document.getElementById('rsaShortfallSurplus');
        const rsaOutputMessageDiv = document.getElementById('rsaOutputMessage');

        rsaProjectedCorpusDiv.textContent = formatIndianCurrency(projectedCorpus);
        rsaRequiredCorpusDiv.textContent = formatIndianCurrency(requiredCorpus);
        rsaShortfallSurplusDiv.textContent = formatIndianCurrency(shortfallOrSurplus);

        if (shortfallOrSurplus >= 0) {
            rsaShortfallSurplusDiv.style.color = 'var(--primary-dark)'; // Green for surplus
            rsaOutputMessageDiv.innerHTML = `Based on your inputs, your projected corpus at retirement is <strong>${formatIndianCurrency(projectedCorpus)}</strong>. To achieve your desired inflation-adjusted income of <strong>${formatIndianCurrency(desiredMonthlyIncomeAtRetirement)} per month</strong>, and account for planned lump sum withdrawals, you need a corpus of <strong>${formatIndianCurrency(requiredCorpus)}</strong>. This results in a:`;
        } else {
            rsaShortfallSurplusDiv.style.color = '#D32F2F'; // Red for shortfall
            rsaOutputMessageDiv.innerHTML = `Based on your inputs, your projected corpus at retirement is <strong>${formatIndianCurrency(projectedCorpus)}</strong>. To achieve your desired inflation-adjusted income of <strong>${formatIndianCurrency(desiredMonthlyIncomeAtRetirement)} per month</strong>, and account for planned lump sum withdrawals, you need a corpus of <strong>${formatIndianCurrency(requiredCorpus)}</strong>. This results in a:`;
        }
        outputSection.style.display = 'block';

        google.charts.load('current', {'packages':['corechart']});
        google.charts.setOnLoadCallback(function() {
            drawChartForRetirementAnalysis(projectedCorpus, requiredCorpus, yearsToRetirement, retirementDurationYears);
        });
    }

    function drawChartForRetirementAnalysis(projectedCorpus, requiredCorpus, yearsToRetirement, retirementDurationYears) {
        const data = new google.visualization.DataTable();
        data.addColumn('string', 'Category'); // Changed to string for labels
        data.addColumn('number', 'Corpus Value');

        data.addRows([
            ['Projected', projectedCorpus],
            ['Required', requiredCorpus]
        ]);

        const options = {
            title: 'Retirement Corpus: Projected vs. Required',
            titleTextStyle: { color: '#2C3E50', fontSize: 19, bold: true },
            legend: { position: 'bottom', textStyle: { color: '#555', fontSize: 12 } },
            hAxis: {
                title: 'Corpus Type',
                textStyle: { color: '#555' },
                titleTextStyle: { color: '#444' },
            },
            vAxis: {
                title: 'Amount (INR)',
                textStyle: { color: '#555' },
                titleTextStyle: { color: '#444' },
                gridlines: { color: '#eee' },
                format: 'short',
                minValue: 0
            },
            series: {
                0: { color: '#4CAF50' }, // Single series, colors will be by bar
            },
            bars: 'vertical', // Required for ColumnChart
            column: {
                colors: ['#4CAF50', '#D32F2F'] // Explicitly set colors for bars
            },
            tooltip: {
                isHtml: true,
                trigger: 'focus',
                formatter: function(data, row, col) {
                    const category = data.getValue(row, 0);
                    const value = data.getValue(row, 1);
                    return `<div style="padding:10px; font-family: 'Open Sans'; font-size: 14px;">` +
                           `<strong>${category} Corpus:</strong> ${formatIndianCurrency(value)}` +
                           `</div>`;
                }
            },
            chartArea: { width: '80%', height: '70%' },
            animation: { duration: 1200, easing: 'out', startup: true },
            backgroundColor: '#fff',
            fontName: 'Open Sans'
        };

        const chart = new google.visualization.ColumnChart(document.getElementById('rsa_chart_div'));
        chart.draw(data, options);
    }


    // --- Menu & Calculator Initialization Functions ---

    /**
     * Scrolls to a specific section on the page.
     * @param {string} sectionId The ID of the section to scroll to.
     */
    function scrollToSection(sectionId) {
        const section = document.getElementById(sectionId);
        if (section) {
            section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    /**
     * Initializes event listeners and displays for Calculator 1 (SIP Required for Future Goal).
     */
    function initializeCalculator1Inputs() {
        const goalAmountSlider = document.getElementById('goalAmountSlider');
        const goalAmountInput = document.getElementById('goalAmountInput');
        const goalAmountValue = document.getElementById('goalAmountValue');
        const timeYearsSlider = document.getElementById('timeYearsSlider');
        const timeYearsInput = document.getElementById('timeYearsInput');
        const timeYearsValue = document.getElementById('timeYearsValue');
        const expectedReturnSlider = document.getElementById('expectedReturnSlider');
        const expectedReturnInput = document.getElementById('expectedReturnInput');
        const expectedReturnValue = document.getElementById('expectedReturnValue');
        const sipGoalOutputSection = document.getElementById('sipGoalOutput');

        // Set initial display values based on input values (which are set in HTML)
        goalAmountValue.textContent = formatIndianCurrency(goalAmountInput.value);
        timeYearsValue.textContent = timeYearsInput.value + ' Years';
        expectedReturnValue.textContent = expectedReturnInput.value + ' %';

        // Attach event listeners
        goalAmountSlider.oninput = () => updateInputFromSlider(goalAmountSlider, goalAmountInput, goalAmountValue, formatIndianCurrency, sipGoalOutputSection);
        goalAmountInput.onchange = () => updateSliderFromInput(goalAmountSlider, goalAmountInput, goalAmountValue, formatIndianCurrency, sipGoalOutputSection);
        timeYearsSlider.oninput = () => updateInputFromSlider(timeYearsSlider, timeYearsInput, timeYearsValue, value => `${value} Years`, sipGoalOutputSection);
        timeYearsInput.onchange = () => updateSliderFromInput(timeYearsSlider, timeYearsInput, timeYearsValue, value => `${value} Years`, sipGoalOutputSection);
        expectedReturnSlider.oninput = () => updateInputFromSlider(expectedReturnSlider, expectedReturnInput, expectedReturnValue, value => `${value.toFixed(1)} %`, sipGoalOutputSection);
        expectedReturnInput.onchange = () => updateSliderFromInput(expectedReturnSlider, expectedReturnInput, expectedReturnValue, value => `${value.toFixed(1)} %`, sipGoalOutputSection);
    }

    /**
     * Initializes event listeners and displays for Calculator 2 (Future Value of SIP).
     */
    function initializeCalculator2Inputs() {
        const sipAmountSlider = document.getElementById('sipAmountSlider');
        const sipAmountInput = document.getElementById('sipAmountInput');
        const sipAmountValue = document.getElementById('sipAmountValue');
        const fvTimeYearsSlider = document.getElementById('fvTimeYearsSlider');
        const fvTimeYearsInput = document.getElementById('fvTimeYearsInput');
        const fvTimeYearsValue = document.getElementById('fvTimeYearsValue');
        const fvExpectedReturnSlider = document.getElementById('fvExpectedReturnSlider');
        const fvExpectedReturnInput = document.getElementById('fvExpectedReturnInput');
        const fvExpectedReturnValue = document.getElementById('fvExpectedReturnValue');
        const fvOutputSection = document.getElementById('sipFVOutput');

        // Set initial display values based on input values (which are set in HTML)
        sipAmountValue.textContent = formatIndianCurrency(sipAmountInput.value);
        fvTimeYearsValue.textContent = fvTimeYearsInput.value + ' Years';
        fvExpectedReturnValue.textContent = fvExpectedReturnInput.value + ' %';

        // Attach event listeners
        sipAmountSlider.oninput = () => updateInputFromSlider(sipAmountSlider, sipAmountInput, sipAmountValue, formatIndianCurrency, fvOutputSection);
        sipAmountInput.onchange = () => updateSliderFromInput(sipAmountSlider, sipAmountInput, sipAmountValue, formatIndianCurrency, fvOutputSection);
        fvTimeYearsSlider.oninput = () => updateInputFromSlider(fvTimeYearsSlider, fvTimeYearsInput, fvTimeYearsValue, value => `${value} Years`, fvOutputSection);
        fvTimeYearsInput.onchange = () => updateSliderFromInput(fvTimeYearsSlider, fvTimeYearsInput, fvTimeYearsValue, value => `${value} Years`, fvOutputSection);
        fvExpectedReturnSlider.oninput = () => updateInputFromSlider(fvExpectedReturnSlider, fvExpectedReturnInput, fvExpectedReturnValue, value => `${value.toFixed(1)} %`, fvOutputSection);
        fvExpectedReturnInput.onchange = () => updateSliderFromInput(fvExpectedReturnSlider, fvExpectedReturnInput, fvExpectedReturnValue, value => `${value.toFixed(1)} %`, fvOutputSection);
    }

    /**
     * Initializes event listeners and displays for Calculator 3 (Lumpsum Required for Future Goal).
     */
    function initializeCalculator3Inputs() {
        const lumpsumGoalAmountSlider = document.getElementById('lumpsumGoalAmountSlider');
        const lumpsumGoalAmountInput = document.getElementById('lumpsumGoalAmountInput');
        const lumpsumGoalAmountValue = document.getElementById('lumpsumGoalAmountValue');
        const lumpsumTimeYearsSlider = document.getElementById('lumpsumTimeYearsSlider');
        const lumpsumTimeYearsInput = document.getElementById('lumpsumTimeYearsInput');
        const lumpsumTimeYearsValue = document.getElementById('lumpsumTimeYearsValue');
        const lumpsumExpectedReturnSlider = document.getElementById('lumpsumExpectedReturnSlider');
        const lumpsumExpectedReturnInput = document.getElementById('lumpsumExpectedReturnInput');
        const lumpsumExpectedReturnValue = document.getElementById('lumpsumExpectedReturnValue');
        const lumpsumGoalOutput = document.getElementById('lumpsumGoalOutput');

        // Set initial display values
        lumpsumGoalAmountValue.textContent = formatIndianCurrency(lumpsumGoalAmountInput.value);
        lumpsumTimeYearsValue.textContent = lumpsumTimeYearsInput.value + ' Years';
        lumpsumExpectedReturnValue.textContent = lumpsumExpectedReturnInput.value + ' %';

        // Attach event listeners
        lumpsumGoalAmountSlider.oninput = () => updateInputFromSlider(lumpsumGoalAmountSlider, lumpsumGoalAmountInput, lumpsumGoalAmountValue, formatIndianCurrency, lumpsumGoalOutput);
        lumpsumGoalAmountInput.onchange = () => updateSliderFromInput(lumpsumGoalAmountSlider, lumpsumGoalAmountInput, lumpsumGoalAmountValue, formatIndianCurrency, lumpsumGoalOutput);
        lumpsumTimeYearsSlider.oninput = () => updateInputFromSlider(lumpsumTimeYearsSlider, lumpsumTimeYearsInput, lumpsumTimeYearsValue, value => `${value} Years`, lumpsumGoalOutput);
        lumpsumTimeYearsInput.onchange = () => updateSliderFromInput(lumpsumTimeYearsSlider, lumpsumTimeYearsInput, lumpsumTimeYearsValue, value => `${value} Years`, lumpsumGoalOutput);
        lumpsumExpectedReturnSlider.oninput = () => updateInputFromSlider(lumpsumExpectedReturnSlider, lumpsumExpectedReturnInput, lumpsumExpectedReturnValue, value => `${value.toFixed(1)} %`, lumpsumGoalOutput);
        lumpsumExpectedReturnInput.onchange = () => updateSliderFromInput(lumpsumExpectedReturnSlider, lumpsumExpectedReturnInput, lumpsumExpectedReturnValue, value => `${value.toFixed(1)} %`, lumpsumGoalOutput);
    }

    /**
     * Initializes event listeners and displays for Calculator 4 (Future Value of Lumpsum).
     */
    function initializeCalculator4Inputs() {
        const fvLumpsumAmountSlider = document.getElementById('fvLumpsumAmountSlider');
        const fvLumpsumAmountInput = document.getElementById('fvLumpsumAmountInput');
        const fvLumpsumAmountValue = document.getElementById('fvLumpsumAmountValue');
        const fvLumpsumTimeYearsSlider = document.getElementById('fvLumpsumTimeYearsSlider');
        const fvLumpsumTimeYearsInput = document.getElementById('fvLumpsumTimeYearsInput');
        const fvLumpsumTimeYearsValue = document.getElementById('fvLumpsumTimeYearsValue');
        const fvLumpsumExpectedReturnSlider = document.getElementById('fvLumpsumExpectedReturnSlider');
        const fvLumpsumExpectedReturnInput = document.getElementById('fvLumpsumExpectedReturnInput');
        const fvLumpsumExpectedReturnValue = document.getElementById('fvLumpsumExpectedReturnValue');
        const fvLumpsumOutput = document.getElementById('fvLumpsumOutput');

        // Set initial display values
        fvLumpsumAmountValue.textContent = formatIndianCurrency(fvLumpsumAmountInput.value);
        fvLumpsumTimeYearsValue.textContent = fvLumpsumTimeYearsInput.value + ' Years';
        fvLumpsumExpectedReturnValue.textContent = fvLumpsumExpectedReturnInput.value + ' %';

        // Attach event listeners
        fvLumpsumAmountSlider.oninput = () => updateInputFromSlider(fvLumpsumAmountSlider, fvLumpsumAmountInput, fvLumpsumAmountValue, formatIndianCurrency, fvLumpsumOutput);
        fvLumpsumAmountInput.onchange = () => updateSliderFromInput(fvLumpsumAmountSlider, fvLumpsumAmountInput, fvLumpsumAmountValue, formatIndianCurrency, fvLumpsumOutput);
        fvLumpsumTimeYearsSlider.oninput = () => updateInputFromSlider(fvLumpsumTimeYearsSlider, fvLumpsumTimeYearsInput, fvLumpsumTimeYearsValue, value => `${value} Years`, fvLumpsumOutput);
        fvLumpsumTimeYearsInput.onchange = () => updateSliderFromInput(fvLumpsumTimeYearsSlider, fvLumpsumTimeYearsInput, fvLumpsumTimeYearsValue, value => `${value} Years`, fvLumpsumOutput);
        fvLumpsumExpectedReturnSlider.oninput = () => updateInputFromSlider(fvLumpsumExpectedReturnSlider, fvLumpsumExpectedReturnInput, fvLumpsumExpectedReturnValue, value => `${value.toFixed(1)} %`, fvLumpsumOutput);
        fvLumpsumExpectedReturnInput.onchange = () => updateSliderFromInput(fvLumpsumExpectedReturnSlider, fvLumpsumExpectedReturnInput, fvLumpsumExpectedReturnValue, value => `${value.toFixed(1)} %`, fvLumpsumOutput);
    }

    /**
     * Initializes event listeners and displays for Calculator 5 (SWP from Retirement Corpus).
     */
    function initializeCalculator5Inputs() {
        const swpCorpusAmountSlider = document.getElementById('swpCorpusAmountSlider');
        const swpCorpusAmountInput = document.getElementById('swpCorpusAmountInput');
        const swpCorpusAmountValue = document.getElementById('swpCorpusAmountValue');
        const swpWithdrawalYearsSlider = document.getElementById('swpWithdrawalYearsSlider');
        const swpWithdrawalYearsInput = document.getElementById('swpWithdrawalYearsInput');
        const swpWithdrawalYearsValue = document.getElementById('swpWithdrawalYearsValue');
        const swpExpectedReturnSlider = document.getElementById('swpExpectedReturnSlider');
        const swpExpectedReturnInput = document.getElementById('swpExpectedReturnInput');
        const swpExpectedReturnValue = document.getElementById('swpExpectedReturnValue');
        const swpOutput = document.getElementById('swpOutput');

        // Set initial display values
        swpCorpusAmountValue.textContent = formatIndianCurrency(swpCorpusAmountInput.value);
        swpWithdrawalYearsValue.textContent = swpWithdrawalYearsInput.value + ' Years';
        swpExpectedReturnValue.textContent = swpExpectedReturnInput.value + ' %';

        // Attach event listeners
        swpCorpusAmountSlider.oninput = () => updateInputFromSlider(swpCorpusAmountSlider, swpCorpusAmountInput, swpCorpusAmountValue, formatIndianCurrency, swpOutput);
        swpCorpusAmountInput.onchange = () => updateSliderFromInput(swpCorpusAmountSlider, swpCorpusAmountInput, swpCorpusAmountValue, formatIndianCurrency, swpOutput);
        swpWithdrawalYearsSlider.oninput = () => updateInputFromSlider(swpWithdrawalYearsSlider, swpWithdrawalYearsInput, swpWithdrawalYearsValue, value => `${value} Years`, swpOutput);
        swpWithdrawalYearsInput.onchange = () => updateSliderFromInput(swpWithdrawalYearsSlider, swpWithdrawalYearsInput, swpWithdrawalYearsValue, value => `${value} Years`, swpOutput);
        swpExpectedReturnSlider.oninput = () => updateInputFromSlider(swpExpectedReturnSlider, swpExpectedReturnInput, swpExpectedReturnValue, value => `${value.toFixed(1)} %`, swpOutput);
        swpExpectedReturnInput.onchange = () => updateSliderFromInput(swpExpectedReturnSlider, swpExpectedReturnInput, swpExpectedReturnValue, value => `${value.toFixed(1)} %`, swpOutput);
    }

    /**
     * Initializes event listeners and displays for Calculator 6 (Corpus Required for SWP).
     */
    function initializeCalculator6Inputs() {
        const crfswpMonthlySWPSlider = document.getElementById('crfswpMonthlySWPSlider');
        const crfswpMonthlySWPInput = document.getElementById('crfswpMonthlySWPInput');
        const crfswpMonthlySWPValue = document.getElementById('crfswpMonthlySWPValue');
        const crfswpWithdrawalYearsSlider = document.getElementById('crfswpWithdrawalYearsSlider');
        const crfswpWithdrawalYearsInput = document.getElementById('crfswpWithdrawalYearsInput');
        const crfswpWithdrawalYearsValue = document.getElementById('crfswpWithdrawalYearsValue');
        const crfswpExpectedReturnSlider = document.getElementById('crfswpExpectedReturnSlider');
        const crfswpExpectedReturnInput = document.getElementById('crfswpExpectedReturnInput');
        const crfswpExpectedReturnValue = document.getElementById('crfswpExpectedReturnValue');
        const crfswpOutput = document.getElementById('crfswpOutput');

        // Set initial display values
        crfswpMonthlySWPValue.textContent = formatIndianCurrency(crfswpMonthlySWPInput.value);
        crfswpWithdrawalYearsValue.textContent = crfswpWithdrawalYearsInput.value + ' Years';
        crfswpExpectedReturnValue.textContent = crfswpExpectedReturnInput.value + ' %';

        // Attach event listeners
        crfswpMonthlySWPSlider.oninput = () => updateInputFromSlider(crfswpMonthlySWPSlider, crfswpMonthlySWPInput, crfswpMonthlySWPValue, formatIndianCurrency, crfswpOutput);
        crfswpMonthlySWPInput.onchange = () => updateSliderFromInput(crfswpMonthlySWPSlider, crfswpMonthlySWPInput, crfswpMonthlySWPValue, formatIndianCurrency, crfswpOutput);
        crfswpWithdrawalYearsSlider.oninput = () => updateInputFromSlider(crfswpWithdrawalYearsSlider, crfswpWithdrawalYearsInput, crfswpWithdrawalYearsValue, value => `${value} Years`, crfswpOutput);
        crfswpWithdrawalYearsInput.onchange = () => updateSliderFromInput(crfswpWithdrawalYearsSlider, crfswpWithdrawalYearsInput, crfswpWithdrawalYearsValue, value => `${value} Years`, crfswpOutput);
        crfswpExpectedReturnSlider.oninput = () => updateInputFromSlider(crfswpExpectedReturnSlider, crfswpExpectedReturnInput, crfswpExpectedReturnValue, value => `${value.toFixed(1)} %`, crfswpOutput);
        crfswpExpectedReturnInput.onchange = () => updateSliderFromInput(crfswpExpectedReturnSlider, crfswpExpectedReturnInput, crfswpExpectedReturnValue, value => `${value.toFixed(1)} %`, crfswpOutput);
    }

    /**
     * Initializes event listeners and displays for Calculator 7 (Future Value of Limited Period SIP).
     */
    function initializeCalculator7Inputs() {
        const fvlsMonthlySIPSlider = document.getElementById('fvlsMonthlySIPSlider');
        const fvlsMonthlySIPInput = document.getElementById('fvlsMonthlySIPInput');
        const fvlsMonthlySIPValue = document.getElementById('fvlsMonthlySIPValue');
        const fvlsSipPeriodSlider = document.getElementById('fvlsSipPeriodSlider');
        const fvlsSipPeriodInput = document.getElementById('fvlsSipPeriodInput');
        const fvlsSipPeriodValue = document.getElementById('fvlsSipPeriodValue');
        const fvlsGrowthPeriodSlider = document.getElementById('fvlsGrowthPeriodSlider');
        const fvlsGrowthPeriodInput = document.getElementById('fvlsGrowthPeriodInput');
        const fvlsGrowthPeriodValue = document.getElementById('fvlsGrowthPeriodValue');
        const fvlsExpectedReturnSlider = document.getElementById('fvlsExpectedReturnSlider');
        const fvlsExpectedReturnInput = document.getElementById('fvlsExpectedReturnInput');
        const fvlsExpectedReturnValue = document.getElementById('fvlsExpectedReturnValue');
        const fvlsOutput = document.getElementById('fvlsOutput');

        // Set initial display values
        fvlsMonthlySIPValue.textContent = formatIndianCurrency(fvlsMonthlySIPInput.value);
        fvlsSipPeriodValue.textContent = fvlsSipPeriodInput.value + ' Years';
        fvlsGrowthPeriodValue.textContent = fvlsGrowthPeriodInput.value + ' Years';
        fvlsExpectedReturnValue.textContent = fvlsExpectedReturnInput.value + ' %';

        // Attach event listeners
        fvlsMonthlySIPSlider.oninput = () => updateInputFromSlider(fvlsMonthlySIPSlider, fvlsMonthlySIPInput, fvlsMonthlySIPValue, formatIndianCurrency, fvlsOutput);
        fvlsMonthlySIPInput.onchange = () => updateSliderFromInput(fvlsMonthlySIPSlider, fvlsMonthlySIPInput, fvlsMonthlySIPValue, formatIndianCurrency, fvlsOutput);
        fvlsSipPeriodSlider.oninput = () => {
            updateInputFromSlider(fvlsSipPeriodSlider, fvlsSipPeriodInput, fvlsSipPeriodValue, value => `${value} Years`, fvlsOutput);
            // Ensure growth period is at least SIP period
            if (parseFloat(fvlsGrowthPeriodInput.value) < parseFloat(fvlsSipPeriodInput.value)) {
                fvlsGrowthPeriodInput.value = fvlsSipPeriodInput.value;
                fvlsGrowthPeriodSlider.value = fvlsSipPeriodInput.value;
                fvlsGrowthPeriodValue.textContent = `${fvlsSipPeriodInput.value} Years`;
            }
        };
        fvlsSipPeriodInput.onchange = () => {
            updateSliderFromInput(fvlsSipPeriodSlider, fvlsSipPeriodInput, fvlsSipPeriodValue, value => `${value} Years`, fvlsOutput);
            if (parseFloat(fvlsGrowthPeriodInput.value) < parseFloat(fvlsSipPeriodInput.value)) {
                fvlsGrowthPeriodInput.value = fvlsSipPeriodInput.value;
                fvlsGrowthPeriodSlider.value = fvlsSipPeriodInput.value;
                fvlsGrowthPeriodValue.textContent = `${fvlsSipPeriodInput.value} Years`;
            }
        };
        fvlsGrowthPeriodSlider.oninput = () => {
            updateInputFromSlider(fvlsGrowthPeriodSlider, fvlsGrowthPeriodInput, fvlsGrowthPeriodValue, value => `${value} Years`, fvlsOutput);
            if (parseFloat(fvlsGrowthPeriodInput.value) < parseFloat(fvlsSipPeriodInput.value)) {
                fvlsGrowthPeriodInput.value = fvlsSipPeriodInput.value;
                fvlsGrowthPeriodSlider.value = fvlsSipPeriodInput.value;
                fvlsGrowthPeriodValue.textContent = `${fvlsSipPeriodInput.value} Years`;
            }
        };
        fvlsGrowthPeriodInput.onchange = () => {
            updateSliderFromInput(fvlsGrowthPeriodSlider, fvlsGrowthPeriodInput, fvlsGrowthPeriodValue, value => `${value} Years`, fvlsOutput);
            if (parseFloat(fvlsGrowthPeriodInput.value) < parseFloat(fvlsSipPeriodInput.value)) {
                fvlsGrowthPeriodInput.value = fvlsSipPeriodInput.value;
                fvlsGrowthPeriodSlider.value = fvlsSipPeriodInput.value;
                fvlsGrowthPeriodValue.textContent = `${fvlsSipPeriodInput.value} Years`;
            }
        };
        fvlsExpectedReturnSlider.oninput = () => updateInputFromSlider(fvlsExpectedReturnSlider, fvlsExpectedReturnInput, fvlsExpectedReturnValue, value => `${value.toFixed(1)} %`, fvlsOutput);
        fvlsExpectedReturnInput.onchange = () => updateSliderFromInput(fvlsExpectedReturnSlider, fvlsExpectedReturnInput, fvlsExpectedReturnValue, value => `${value.toFixed(1)} %`, fvlsOutput);
    }

    /**
     * Initializes event listeners and displays for Calculator 8 (Limited SIP Required for Goal).
     */
    function initializeCalculator8Inputs() {
        const lsrgGoalAmountSlider = document.getElementById('lsrgGoalAmountSlider');
        const lsrgGoalAmountInput = document.getElementById('lsrgGoalAmountInput');
        const lsrgGoalAmountValue = document.getElementById('lsrgGoalAmountValue');
        const lsrgSipPeriodSlider = document.getElementById('lsrgSipPeriodSlider');
        const lsrgSipPeriodInput = document.getElementById('lsrgSipPeriodInput');
        const lsrgSipPeriodValue = document.getElementById('lsrgSipPeriodValue');
        const lsrgGrowthPeriodSlider = document.getElementById('lsrgGrowthPeriodSlider');
        const lsrgGrowthPeriodInput = document.getElementById('lsrgGrowthPeriodInput');
        const lsrgGrowthPeriodValue = document.getElementById('lsrgGrowthPeriodValue');
        const lsrgExpectedReturnSlider = document.getElementById('lsrgExpectedReturnSlider');
        const lsrgExpectedReturnInput = document.getElementById('lsrgExpectedReturnInput');
        const lsrgExpectedReturnValue = document.getElementById('lsrgExpectedReturnValue');
        const lsrgOutput = document.getElementById('lsrgOutput');

        // Set initial display values
        lsrgGoalAmountValue.textContent = formatIndianCurrency(lsrgGoalAmountInput.value);
        lsrgSipPeriodValue.textContent = lsrgSipPeriodInput.value + ' Years';
        lsrgGrowthPeriodValue.textContent = lsrgGrowthPeriodInput.value + ' Years';
        lsrgExpectedReturnValue.textContent = lsrgExpectedReturnInput.value + ' %';

        // Attach event listeners
        lsrgGoalAmountSlider.oninput = () => updateInputFromSlider(lsrgGoalAmountSlider, lsrgGoalAmountInput, lsrgGoalAmountValue, formatIndianCurrency, lsrgOutput);
        lsrgGoalAmountInput.onchange = () => updateSliderFromInput(lsrgGoalAmountSlider, lsrgGoalAmountInput, lsrgGoalAmountValue, formatIndianCurrency, lsrgOutput);
        lsrgSipPeriodSlider.oninput = () => {
            updateInputFromSlider(lsrgSipPeriodSlider, lsrgSipPeriodInput, lsrgSipPeriodValue, value => `${value} Years`, lsrgOutput);
            if (parseFloat(lsrgGrowthPeriodInput.value) < parseFloat(lsrgSipPeriodInput.value)) {
                lsrgGrowthPeriodInput.value = lsrgSipPeriodInput.value;
                lsrgGrowthPeriodSlider.value = lsrgSipPeriodInput.value;
                lsrgGrowthPeriodValue.textContent = `${lsrgSipPeriodInput.value} Years`;
            }
        };
        lsrgSipPeriodInput.onchange = () => {
            updateSliderFromInput(lsrgSipPeriodSlider, lsrgSipPeriodInput, lsrgSipPeriodValue, value => `${value} Years`, lsrgOutput);
            if (parseFloat(lsrgGrowthPeriodInput.value) < parseFloat(lsrgSipPeriodInput.value)) {
                lsrgGrowthPeriodInput.value = lsrgSipPeriodInput.value;
                lsrgGrowthPeriodSlider.value = lsrgSipPeriodInput.value;
                lsrgGrowthPeriodValue.textContent = `${lsrgSipPeriodInput.value} Years`;
            }
        };
        lsrgGrowthPeriodSlider.oninput = () => {
            updateInputFromSlider(lsrgGrowthPeriodSlider, lsrgGrowthPeriodInput, lsrgGrowthPeriodValue, value => `${value} Years`, lsrgOutput);
            if (parseFloat(lsrgGrowthPeriodInput.value) < parseFloat(lsrgSipPeriodInput.value)) {
                lsrgGrowthPeriodInput.value = lsrgSipPeriodInput.value;
                lsrgGrowthPeriodSlider.value = lsrgSipPeriodInput.value;
                lsrgGrowthPeriodValue.textContent = `${lsrgSipPeriodInput.value} Years`;
            }
        };
        lsrgGrowthPeriodInput.onchange = () => {
            updateSliderFromInput(lsrgGrowthPeriodSlider, lsrgGrowthPeriodInput, lsrgGrowthPeriodValue, value => `${value} Years`, lsrgOutput);
            if (parseFloat(lsrgGrowthPeriodInput.value) < parseFloat(lsrgSipPeriodInput.value)) {
                lsrgGrowthPeriodInput.value = lsrgSipPeriodInput.value;
                lsrgGrowthPeriodSlider.value = lsrgSipPeriodInput.value;
                lsrgGrowthPeriodValue.textContent = `${lsrgSipPeriodInput.value} Years`;
            }
        };
        lsrgExpectedReturnSlider.oninput = () => updateInputFromSlider(lsrgExpectedReturnSlider, lsrgExpectedReturnInput, lsrgExpectedReturnValue, value => `${value.toFixed(1)} %`, lsrgOutput);
        lsrgExpectedReturnInput.onchange = () => updateSliderFromInput(lsrgExpectedReturnSlider, lsrgExpectedReturnInput, lsrgExpectedReturnValue, value => `${value.toFixed(1)} %`, lsrgOutput);
    }

    /**
     * Initializes event listeners and displays for Calculator 9 (Future Value of SIP + One-Time).
     */
    function initializeCalculator9Inputs() {
        const fvsotMonthlySIPSlider = document.getElementById('fvsotMonthlySIPSlider');
        const fvsotMonthlySIPInput = document.getElementById('fvsotMonthlySIPInput');
        const fvsotMonthlySIPValue = document.getElementById('fvsotMonthlySIPValue');
        const fvsotLumpsumAmountSlider = document.getElementById('fvsotLumpsumAmountSlider');
        const fvsotLumpsumAmountInput = document.getElementById('fvsotLumpsumAmountInput');
        const fvsotLumpsumAmountValue = document.getElementById('fvsotLumpsumAmountValue');
        const fvsotTimeYearsSlider = document.getElementById('fvsotTimeYearsSlider');
        const fvsotTimeYearsInput = document.getElementById('fvsotTimeYearsInput');
        const fvsotTimeYearsValue = document.getElementById('fvsotTimeYearsValue');
        const fvsotExpectedReturnSlider = document.getElementById('fvsotExpectedReturnSlider');
        const fvsotExpectedReturnInput = document.getElementById('fvsotExpectedReturnInput');
        const fvsotExpectedReturnValue = document.getElementById('fvsotExpectedReturnValue');
        const fvsotOutput = document.getElementById('fvsotOutput');

        // Set initial display values
        fvsotMonthlySIPValue.textContent = formatIndianCurrency(fvsotMonthlySIPInput.value);
        fvsotLumpsumAmountValue.textContent = formatIndianCurrency(fvsotLumpsumAmountInput.value);
        fvsotTimeYearsValue.textContent = fvsotTimeYearsInput.value + ' Years';
        fvsotExpectedReturnValue.textContent = fvsotExpectedReturnInput.value + ' %';

        // Attach event listeners
        fvsotMonthlySIPSlider.oninput = () => updateInputFromSlider(fvsotMonthlySIPSlider, fvsotMonthlySIPInput, fvsotMonthlySIPValue, formatIndianCurrency, fvsotOutput);
        fvsotMonthlySIPInput.onchange = () => updateSliderFromInput(fvsotMonthlySIPSlider, fvsotMonthlySIPInput, fvsotMonthlySIPValue, formatIndianCurrency, fvsotOutput);
        fvsotLumpsumAmountSlider.oninput = () => updateInputFromSlider(fvsotLumpsumAmountSlider, fvsotLumpsumAmountInput, fvsotLumpsumAmountValue, formatIndianCurrency, fvsotOutput);
        fvsotLumpsumAmountInput.onchange = () => updateSliderFromInput(fvsotLumpsumAmountSlider, fvsotLumpsumAmountInput, fvsotLumpsumAmountValue, formatIndianCurrency, fvsotOutput);
        fvsotTimeYearsSlider.oninput = () => updateInputFromSlider(fvsotTimeYearsSlider, fvsotTimeYearsInput, fvsotTimeYearsValue, value => `${value} Years`, fvsotOutput);
        fvsotTimeYearsInput.onchange = () => updateSliderFromInput(fvsotTimeYearsSlider, fvsotTimeYearsInput, fvsotTimeYearsValue, value => `${value} Years`, fvsotOutput);
        fvsotExpectedReturnSlider.oninput = () => updateInputFromSlider(fvsotExpectedReturnSlider, fvsotExpectedReturnInput, fvsotExpectedReturnValue, value => `${value.toFixed(1)} %`, fvsotOutput);
        fvsotExpectedReturnInput.onchange = () => updateSliderFromInput(fvsotExpectedReturnSlider, fvsotExpectedReturnInput, fvsotExpectedReturnValue, value => `${value.toFixed(1)} %`, fvsotOutput);
    }

    /**
     * Initializes event listeners and displays for Calculator 10 (One-Time Required (if SIP known)).
     */
    function initializeCalculator10Inputs() {
        const otrsikGoalAmountSlider = document.getElementById('otrsikGoalAmountSlider');
        const otrsikGoalAmountInput = document.getElementById('otrsikGoalAmountInput');
        const otrsikGoalAmountValue = document.getElementById('otrsikGoalAmountValue');
        const otrsikMonthlySIPSlider = document.getElementById('otrsikMonthlySIPSlider');
        const otrsikMonthlySIPInput = document.getElementById('otrsikMonthlySIPInput');
        const otrsikMonthlySIPValue = document.getElementById('otrsikMonthlySIPValue');
        const otrsikTimeYearsSlider = document.getElementById('otrsikTimeYearsSlider');
        const otrsikTimeYearsInput = document.getElementById('otrsikTimeYearsInput');
        const otrsikTimeYearsValue = document.getElementById('otrsikTimeYearsValue');
        const otrsikExpectedReturnSlider = document.getElementById('otrsikExpectedReturnSlider');
        const otrsikExpectedReturnInput = document.getElementById('otrsikExpectedReturnInput');
        const otrsikExpectedReturnValue = document.getElementById('otrsikExpectedReturnValue');
        const otrsikOutput = document.getElementById('otrsikOutput');

        // Set initial display values
        otrsikGoalAmountValue.textContent = formatIndianCurrency(otrsikGoalAmountInput.value);
        otrsikMonthlySIPValue.textContent = formatIndianCurrency(otrsikMonthlySIPInput.value);
        otrsikTimeYearsValue.textContent = otrsikTimeYearsInput.value + ' Years';
        otrsikExpectedReturnValue.textContent = otrsikExpectedReturnInput.value + ' %';

        // Attach event listeners
        otrsikGoalAmountSlider.oninput = () => updateInputFromSlider(otrsikGoalAmountSlider, otrsikGoalAmountInput, otrsikGoalAmountValue, formatIndianCurrency, otrsikOutput);
        otrsikGoalAmountInput.onchange = () => updateSliderFromInput(otrsikGoalAmountSlider, otrsikGoalAmountInput, otrsikGoalAmountValue, formatIndianCurrency, otrsikOutput);
        otrsikMonthlySIPSlider.oninput = () => updateInputFromSlider(otrsikMonthlySIPSlider, otrsikMonthlySIPInput, otrsikMonthlySIPValue, formatIndianCurrency, otrsikOutput);
        otrsikMonthlySIPInput.onchange = () => updateSliderFromInput(otrsikMonthlySIPSlider, otrsikMonthlySIPInput, otrsikMonthlySIPValue, formatIndianCurrency, otrsikOutput);
        otrsikTimeYearsSlider.oninput = () => updateInputFromSlider(otrsikTimeYearsSlider, otrsikTimeYearsInput, otrsikTimeYearsValue, value => `${value} Years`, otrsikOutput);
        otrsikTimeYearsInput.onchange = () => updateSliderFromInput(otrsikTimeYearsSlider, otrsikTimeYearsInput, otrsikTimeYearsValue, value => `${value} Years`, otrsikOutput);
        otrsikExpectedReturnSlider.oninput = () => updateInputFromSlider(otrsikExpectedReturnSlider, otrsikExpectedReturnInput, otrsikExpectedReturnValue, value => `${value.toFixed(1)} %`, otrsikOutput);
        otrsikExpectedReturnInput.onchange = () => updateSliderFromInput(otrsikExpectedReturnSlider, otrsikExpectedReturnInput, otrsikExpectedReturnValue, value => `${value.toFixed(1)} %`, otrsikOutput);
    }

    /**
     * Initializes event listeners and displays for Calculator 11 (SIP Required (if One-Time known)).
     */
    function initializeCalculator11Inputs() {
        const sriotkGoalAmountSlider = document.getElementById('sriotkGoalAmountSlider');
        const sriotkGoalAmountInput = document.getElementById('sriotkGoalAmountInput');
        const sriotkGoalAmountValue = document.getElementById('sriotkGoalAmountValue');
        const sriotkLumpsumAmountSlider = document.getElementById('sriotkLumpsumAmountSlider');
        const sriotkLumpsumAmountInput = document.getElementById('sriotkLumpsumAmountInput');
        const sriotkLumpsumAmountValue = document.getElementById('sriotkLumpsumAmountValue');
        const sriotkTimeYearsSlider = document.getElementById('sriotkTimeYearsSlider');
        const sriotkTimeYearsInput = document.getElementById('sriotkTimeYearsInput');
        const sriotkTimeYearsValue = document.getElementById('sriotkTimeYearsValue');
        const sriotkExpectedReturnSlider = document.getElementById('sriotkExpectedReturnSlider');
        const sriotkExpectedReturnInput = document.getElementById('sriotkExpectedReturnInput');
        const sriotkExpectedReturnValue = document.getElementById('sriotkExpectedReturnValue');
        const sriotkOutput = document.getElementById('sriotkOutput');

        // Set initial display values
        sriotkGoalAmountValue.textContent = formatIndianCurrency(sriotkGoalAmountInput.value);
        sriotkLumpsumAmountValue.textContent = formatIndianCurrency(sriotkLumpsumAmountInput.value);
        sriotkTimeYearsValue.textContent = sriotkTimeYearsInput.value + ' Years';
        sriotkExpectedReturnValue.textContent = sriotkExpectedReturnInput.value + ' %';

        // Attach event listeners
        sriotkGoalAmountSlider.oninput = () => updateInputFromSlider(sriotkGoalAmountSlider, sriotkGoalAmountInput, sriotkGoalAmountValue, formatIndianCurrency, sriotkOutput);
        sriotkGoalAmountInput.onchange = () => updateSliderFromInput(sriotkGoalAmountSlider, sriotkGoalAmountInput, sriotkGoalAmountValue, formatIndianCurrency, sriotkOutput);
        sriotkLumpsumAmountSlider.oninput = () => updateInputFromSlider(sriotkLumpsumAmountSlider, sriotkLumpsumAmountInput, sriotkLumpsumAmountValue, formatIndianCurrency, sriotkOutput);
        sriotkLumpsumAmountInput.onchange = () => updateSliderFromInput(sriotkLumpsumAmountSlider, sriotkLumpsumAmountInput, sriotkLumpsumAmountValue, formatIndianCurrency, sriotkOutput);
        sriotkTimeYearsSlider.oninput = () => updateInputFromSlider(sriotkTimeYearsSlider, sriotkTimeYearsInput, sriotkTimeYearsValue, value => `${value} Years`, sriotkOutput);
        sriotkTimeYearsInput.onchange = () => updateSliderFromInput(sriotkTimeYearsSlider, sriotkTimeYearsInput, sriotkTimeYearsValue, value => `${value} Years`, sriotkOutput);
        sriotkExpectedReturnSlider.oninput = () => updateInputFromSlider(sriotkExpectedReturnSlider, sriotkExpectedReturnInput, sriotkExpectedReturnValue, value => `${value.toFixed(1)} %`, sriotkOutput);
        sriotkExpectedReturnInput.onchange = () => updateSliderFromInput(sriotkExpectedReturnSlider, sriotkExpectedReturnInput, sriotkExpectedReturnValue, value => `${value.toFixed(1)} %`, sriotkOutput);
    }

    /**
     * Initializes event listeners and displays for Calculator 12 (Inflation-Adjusted SWP).
     */
    function initializeCalculator12Inputs() {
        const iaswpCorpusAmountSlider = document.getElementById('iaswpCorpusAmountSlider');
        const iaswpCorpusAmountInput = document.getElementById('iaswpCorpusAmountInput');
        const iaswpCorpusAmountValue = document.getElementById('iaswpCorpusAmountValue');
        const iaswpWithdrawalYearsSlider = document.getElementById('iaswpWithdrawalYearsSlider');
        const iaswpWithdrawalYearsInput = document.getElementById('iaswpWithdrawalYearsInput');
        const iaswpWithdrawalYearsValue = document.getElementById('iaswpWithdrawalYearsValue');
        const iaswpExpectedReturnSlider = document.getElementById('iaswpExpectedReturnSlider');
        const iaswpExpectedReturnInput = document.getElementById('iaswpExpectedReturnInput');
        const iaswpExpectedReturnValue = document.getElementById('iaswpExpectedReturnValue');
        const iaswpInflationRateSlider = document.getElementById('iaswpInflationRateSlider');
        const iaswpInflationRateInput = document.getElementById('iaswpInflationRateInput');
        const iaswpInflationRateValue = document.getElementById('iaswpInflationRateValue');
        const iaswpOutput = document.getElementById('iaswpOutput');

        // Set initial display values
        iaswpCorpusAmountValue.textContent = formatIndianCurrency(iaswpCorpusAmountInput.value);
        iaswpWithdrawalYearsValue.textContent = iaswpWithdrawalYearsInput.value + ' Years';
        iaswpExpectedReturnValue.textContent = iaswpExpectedReturnInput.value + ' %';
        iaswpInflationRateValue.textContent = iaswpInflationRateInput.value + ' %';

        // Attach event listeners
        iaswpCorpusAmountSlider.oninput = () => updateInputFromSlider(iaswpCorpusAmountSlider, iaswpCorpusAmountInput, iaswpCorpusAmountValue, formatIndianCurrency, iaswpOutput);
        iaswpCorpusAmountInput.onchange = () => updateSliderFromInput(iaswpCorpusAmountSlider, iaswpCorpusAmountInput, iaswpCorpusAmountValue, formatIndianCurrency, iaswpOutput);
        iaswpWithdrawalYearsSlider.oninput = () => updateInputFromSlider(iaswpWithdrawalYearsSlider, iaswpWithdrawalYearsInput, iaswpWithdrawalYearsValue, value => `${value} Years`, iaswpOutput);
        iaswpWithdrawalYearsInput.onchange = () => updateSliderFromInput(iaswpWithdrawalYearsSlider, iaswpWithdrawalYearsInput, iaswpWithdrawalYearsValue, value => `${value} Years`, iaswpOutput);
        iaswpExpectedReturnSlider.oninput = () => updateInputFromSlider(iaswpExpectedReturnSlider, iaswpExpectedReturnInput, iaswpExpectedReturnValue, value => `${value.toFixed(1)} %`, iaswpOutput);
        iaswpExpectedReturnInput.onchange = () => updateSliderFromInput(iaswpExpectedReturnSlider, iaswpExpectedReturnInput, iaswpExpectedReturnValue, value => `${value.toFixed(1)} %`, iaswpOutput);
        iaswpInflationRateSlider.oninput = () => updateInputFromSlider(iaswpInflationRateSlider, iaswpInflationRateInput, iaswpInflationRateValue, value => `${value.toFixed(1)} %`, iaswpOutput);
        iaswpInflationRateInput.onchange = () => updateSliderFromInput(iaswpInflationRateSlider, iaswpInflationRateInput, iaswpInflationRateValue, value => `${value.toFixed(1)} %`, iaswpOutput);
    }

    /**
     * Initializes event listeners and displays for Calculator 13 (Retirement Shortfall/Surplus Analysis).
     */
    function initializeCalculator13Inputs() {
        const rsaCurrentCorpusSlider = document.getElementById('rsaCurrentCorpusSlider');
        const rsaCurrentCorpusInput = document.getElementById('rsaCurrentCorpusInput');
        const rsaCurrentCorpusValue = document.getElementById('rsaCurrentCorpusValue');
        const rsaMonthlySIPSlider = document.getElementById('rsaMonthlySIPSlider');
        const rsaMonthlySIPInput = document.getElementById('rsaMonthlySIPInput');
        const rsaMonthlySIPValue = document.getElementById('rsaMonthlySIPValue');
        const rsaYearsToRetirementSlider = document.getElementById('rsaYearsToRetirementSlider');
        const rsaYearsToRetirementInput = document.getElementById('rsaYearsToRetirementInput');
        const rsaYearsToRetirementValue = document.getElementById('rsaYearsToRetirementValue');
        const rsaDesiredMonthlyIncomeSlider = document.getElementById('rsaDesiredMonthlyIncomeSlider');
        const rsaDesiredMonthlyIncomeInput = document.getElementById('rsaDesiredMonthlyIncomeInput');
        const rsaDesiredMonthlyIncomeValue = document.getElementById('rsaDesiredMonthlyIncomeValue');
        const rsaRetirementDurationSlider = document.getElementById('rsaRetirementDurationSlider');
        const rsaRetirementDurationInput = document.getElementById('rsaRetirementDurationInput');
        const rsaRetirementDurationValue = document.getElementById('rsaRetirementDurationValue');
        const rsaReturnPreRetirementSlider = document.getElementById('rsaReturnPreRetirementSlider');
        const rsaReturnPreRetirementInput = document.getElementById('rsaReturnPreRetirementInput');
        const rsaReturnPreRetirementValue = document.getElementById('rsaReturnPreRetirementValue');
        const rsaReturnPostRetirementSlider = document.getElementById('rsaReturnPostRetirementSlider');
        const rsaReturnPostRetirementInput = document.getElementById('rsaReturnPostRetirementInput');
        const rsaReturnPostRetirementValue = document.getElementById('rsaReturnPostRetirementValue');
        const rsaInflationRateSlider = document.getElementById('rsaInflationRateSlider');
        const rsaInflationRateInput = document.getElementById('rsaInflationRateInput');
        const rsaInflationRateValue = document.getElementById('rsaInflationRateValue');
        const rsaOutput = document.getElementById('rsaOutput');

        // Set initial display values
        rsaCurrentCorpusValue.textContent = formatIndianCurrency(rsaCurrentCorpusInput.value);
        rsaMonthlySIPValue.textContent = formatIndianCurrency(rsaMonthlySIPInput.value);
        rsaYearsToRetirementValue.textContent = rsaYearsToRetirementInput.value + ' Years';
        rsaDesiredMonthlyIncomeValue.textContent = formatIndianCurrency(rsaDesiredMonthlyIncomeInput.value);
        rsaRetirementDurationValue.textContent = rsaRetirementDurationInput.value + ' Years';
        rsaReturnPreRetirementValue.textContent = rsaReturnPreRetirementInput.value + ' %';
        rsaReturnPostRetirementValue.textContent = rsaReturnPostRetirementInput.value + ' %';
        rsaInflationRateValue.textContent = rsaInflationRateInput.value + ' %';

        // Attach event listeners
        rsaCurrentCorpusSlider.oninput = () => updateInputFromSlider(rsaCurrentCorpusSlider, rsaCurrentCorpusInput, rsaCurrentCorpusValue, formatIndianCurrency, rsaOutput);
        rsaCurrentCorpusInput.onchange = () => updateSliderFromInput(rsaCurrentCorpusSlider, rsaCurrentCorpusInput, rsaCurrentCorpusValue, formatIndianCurrency, rsaOutput);
        rsaMonthlySIPSlider.oninput = () => updateInputFromSlider(rsaMonthlySIPSlider, rsaMonthlySIPInput, rsaMonthlySIPValue, formatIndianCurrency, rsaOutput);
        rsaMonthlySIPInput.onchange = () => updateSliderFromInput(rsaMonthlySIPSlider, rsaMonthlySIPInput, rsaMonthlySIPValue, formatIndianCurrency, rsaOutput);
        rsaYearsToRetirementSlider.oninput = () => updateInputFromSlider(rsaYearsToRetirementSlider, rsaYearsToRetirementInput, rsaYearsToRetirementValue, value => `${value} Years`, rsaOutput);
        rsaYearsToRetirementInput.onchange = () => updateSliderFromInput(rsaYearsToRetirementSlider, rsaYearsToRetirementInput, rsaYearsToRetirementValue, value => `${value} Years`, rsaOutput);
        rsaDesiredMonthlyIncomeSlider.oninput = () => updateInputFromSlider(rsaDesiredMonthlyIncomeSlider, rsaDesiredMonthlyIncomeInput, rsaDesiredMonthlyIncomeValue, formatIndianCurrency, rsaOutput);
        rsaDesiredMonthlyIncomeInput.onchange = () => updateSliderFromInput(rsaDesiredMonthlyIncomeSlider, rsaDesiredMonthlyIncomeInput, rsaDesiredMonthlyIncomeValue, formatIndianCurrency, rsaOutput);
        rsaRetirementDurationSlider.oninput = () => updateInputFromSlider(rsaRetirementDurationSlider, rsaRetirementDurationInput, rsaRetirementDurationValue, value => `${value} Years`, rsaOutput);
        rsaRetirementDurationInput.onchange = () => updateSliderFromInput(rsaRetirementDurationSlider, rsaRetirementDurationInput, rsaRetirementDurationValue, value => `${value} Years`, rsaOutput);
        rsaReturnPreRetirementSlider.oninput = () => updateInputFromSlider(rsaReturnPreRetirementSlider, rsaReturnPreRetirementInput, rsaReturnPreRetirementValue, value => `${value.toFixed(1)} %`, rsaOutput);
        rsaReturnPreRetirementInput.onchange = () => updateSliderFromInput(rsaReturnPreRetirementSlider, rsaReturnPreRetirementInput, rsaReturnPreRetirementValue, value => `${value.toFixed(1)} %`, rsaOutput);
        rsaReturnPostRetirementSlider.oninput = () => updateInputFromSlider(rsaReturnPostRetirementSlider, rsaReturnPostRetirementInput, rsaReturnPostRetirementValue, value => `${value.toFixed(1)} %`, rsaOutput);
        rsaReturnPostRetirementInput.onchange = () => updateSliderFromInput(rsaReturnPostRetirementSlider, rsaReturnPostRetirementInput, rsaReturnPostRetirementValue, value => `${value.toFixed(1)} %`, rsaOutput);
        rsaInflationRateSlider.oninput = () => updateInputFromSlider(rsaInflationRateSlider, rsaInflationRateInput, rsaInflationRateValue, value => `${value.toFixed(1)} %`, rsaOutput);
        rsaInflationRateInput.onchange = () => updateSliderFromInput(rsaInflationRateSlider, rsaInflationRateInput, rsaInflationRateValue, value => `${value.toFixed(1)} %`, rsaOutput);
    }


    /**
     * Initializes all calculator input elements and their event listeners.
     * This function is called once on DOMContentLoaded since all content is on one page.
     */
    function initializeAllCalculatorInputs() {
        // Initialize Calculator 1 (SIP Required for Future Goal)
        initializeCalculator1Inputs();
        // Initialize Calculator 2 (Future Value of SIP)
        initializeCalculator2Inputs();
        // Initialize Calculator 3 (Lumpsum Required for Future Goal)
        initializeCalculator3Inputs();
        // Initialize Calculator 4 (Future Value of Lumpsum)
        initializeCalculator4Inputs();
        // Initialize Calculator 5 (SWP from Retirement Corpus)
        initializeCalculator5Inputs();
        // Initialize Calculator 6 (Corpus Required for SWP)
        initializeCalculator6Inputs();
        // Initialize Calculator 7 (Future Value of Limited Period SIP)
        initializeCalculator7Inputs();
        // Initialize Calculator 8 (Limited SIP Required for Goal)
        initializeCalculator8Inputs();
        // Initialize Calculator 9 (Future Value of SIP + One-Time)
        initializeCalculator9Inputs();
        // Initialize Calculator 10 (One-Time Required (if SIP known))
        initializeCalculator10Inputs();
        // Initialize Calculator 11 (SIP Required (if One-Time known))
        initializeCalculator11Inputs();
        // Initialize Calculator 12 (Inflation-Adjusted SWP)
        initializeCalculator12Inputs();
        // Initialize Calculator 13 (Retirement Shortfall/Surplus Analysis)
        initializeCalculator13Inputs();
    }

    /**
     * Shows a specific calculator and hides others within its category.
     * @param {string} calculatorId The ID of the calculator section to display.
     */
    function showCalculator(calculatorId) {
        // Find the parent category section of the calculator
        const calculatorElement = document.getElementById(calculatorId);
        if (!calculatorElement) return;

        const parentSection = calculatorElement.closest('.full-page-section');
        if (!parentSection) return;

        // Hide all calculators within this parent section
        parentSection.querySelectorAll('.calculator-section').forEach(calc => {
            calc.style.display = 'none';
            calc.classList.remove('active');
        });

        // Show the selected calculator
        calculatorElement.style.display = 'block';
        calculatorElement.classList.add('active');
        calculatorElement.scrollIntoView({ behavior: 'smooth', block: 'start' });

        // Update active sub-tab styling
        parentSection.querySelectorAll('.sub-tab-button').forEach(button => {
            if (button.dataset.calculator === calculatorId) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        });
    }


    /**
     * Shows the selected category tab and hides others.
     * @param {string} categoryId The ID of the category section to display.
     */
    function showCategoryTab(categoryId) {
        // Hide all full-page sections
        document.querySelectorAll('.full-page-section').forEach(section => {
            section.style.display = 'none';
        });

        // Show the selected section
        const activeSection = document.getElementById(categoryId);
        if (activeSection) {
            activeSection.style.display = 'block';
            // Scroll to the top of the displayed section for better UX on mobile
            activeSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

            // Automatically show the first calculator in the newly active category
            const firstCalculatorInActiveSection = activeSection.querySelector('.calculator-section');
            if (firstCalculatorInActiveSection) {
                showCalculator(firstCalculatorInActiveSection.id);
            }
        }

        // Update active main tab styling
        document.querySelectorAll('.tab-button').forEach(button => {
            if (button.dataset.tab === categoryId) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        });
    }

    // Initial load: Initialize all inputs and set up logo placeholder
    document.addEventListener('DOMContentLoaded', function() {
        initializeAllCalculatorInputs();

        // Attach event listeners to main tab buttons
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', function() {
                showCategoryTab(this.dataset.tab);
            });
        });

        // Attach event listeners to sub-tab buttons
        document.querySelectorAll('.sub-tab-button').forEach(button => {
            button.addEventListener('click', function() {
                showCalculator(this.dataset.calculator);
            });
        });

        // Show the default tab (Dream Planning Section) on load
        // This will also automatically show the first calculator within it
        showCategoryTab('dreamPlanningSection');
    });
  </script>
</body>
</html>
