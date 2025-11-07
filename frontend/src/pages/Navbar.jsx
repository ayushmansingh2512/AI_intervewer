import React, { useState } from 'react';
import Lottie from 'lottie-react';
import ghostAnimation from '../assets/images/ghost.json';

// 1. Expanded array of funny quotes (now with more jokes!)
const FUNNY_QUOTES = [
  "Why do programmers prefer dark mode? Because light attracts bugs!",
  "There are 10 types of people in the world: those who understand binary, and those who don't.",
  "I'm not lazy, I'm just on energy-saving mode.",
  "A programmer's life: 99 little bugs in the code, 99 little bugs. Take one down, patch it around, 127 little bugs in the code.",
  "Hardware: The part of a computer that you can kick.",
  "My code DOESN'T work? Why? My code WORKS? WHY?!",
  "It's not a bug, it's an undocumented feature.",
  "Software development: The art of turning caffeine into code.",
  "// This code is a mess, but it works. Don't touch it.",
  "rm -rf / ... Oops.",
  "Why was the JavaScript developer sad? Because he didn't know how to 'null' his feelings.",
  "What's a programmer's favorite place to hang out? Foo Bar.",
  "How many programmers does it take to change a light bulb? None, that's a hardware problem.",
  "Why do Java developers wear glasses? Because they don't C#.",
  "To understand recursion, you must first understand recursion.",
  "I'd tell you a UDP joke, but you might not get it.",
  "A SQL query walks into a bar, walks up to two tables and asks, 'Can I join you?'",
  "Don't worry, the 3rd-party API said it has 99.9% uptime. It's just down for the 0.1% right now.",
  "I had a problem, so I decided to use regular expressions. Now I have two problems.",
  "Algorithm: A word used by programmers when they don't want to explain what they did.",
  "What's the object-oriented way to get wealthy? Inheritance.",
  "Why don't programmers like nature? It has too many bugs.",
  "What did the Java code say to the C code? 'You've got no class.'",
  "Why was the computer cold? It left its Windows open.",
  "I'm reading a book on anti-gravity. It's impossible to put down!",
  "What's a ghost's favorite data type? A boo-lean.",
  "I tried to make a password '12345678', but my computer said it was too weak. I told it, 'Hey, at least I tried.'",
  "Why did the developer go broke? Because he used up all his cache.",
  "How do you comfort a JavaScript bug? You console it.",
  "Programmer's motto: 'If at first you don't succeed, call it version 1.0.'",
  "A frontend developer and a backend developer were arguing. It went on for `div`s and `div`s.",
  "Why did the two JavaScript variables break up? Because they didn't have `const`ant love.",
  "What's a developer's favorite song? 'Hello, World!' by Adele.",
  "Why was the JavaScript file so sad? It had too many `null` values in its life.",
  "My computer is so slow, it's faster to mail a floppy disk.",
  "Why are keyboards so needy? They're always looking for their `type`.",
  "I told my computer I needed a break. Now it won't stop sending me ads for Kit Kats.",
  "What do you call a developer who doesn't comment their code? A liability.",
  "Why did the database administrator leave his wife? She had one-to-many relationships.",
  "My code never has bugs. It just develops random, unexpected features.",
  "A Python developer walks into a bar. The bartender says, 'Sorry, we don't serve snakes here.' The developer says, 'But I'm a `class`y one!'",
  "Why did the CSS developer go to therapy? To deal with his separation anxiety.",
  "What's the best way to learn recursion? First, learn recursion.",
  "Why do C# developers get all the dates? Because they're `class`y.",
  "I put my root password on eBay. It got sold, but now I have to pay to get it back.",
  "Why did the web developer get fired? He was always `div`-ing into arguments.",
  "My code is like a submarine. If it's working, I don't touch it.",
  "What did the array say to the linked list? 'Stop `null`-ifying my life!'",
  "Why was the developer always calm? He had inner `peace` (of code).",
  "There's a band called 1023MB. They haven't had any gigs yet.",
  "Why did the programmer get stuck in the shower? The instructions on the shampoo bottle said: 'Lather, Rinse, Repeat.'"
];

const Navbar = () => {
  const [isHovered, setIsHovered] = useState(false);
  const [message, setMessage] = useState('');
  
  const firstName = localStorage.getItem('first_name') || 'friend';

  const defaultGreeting = `Hello ${firstName}, I am parakh.ai ka chota assistant ,  I am here to help you crack interviews. Hope we work hard together! 🚀`;

  const handleMouseEnter = () => {
    setMessage(defaultGreeting);
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  const handleGhostClick = (e) => {
    e.stopPropagation(); 
    // The random logic already handles the new, larger array
    const randomIndex = Math.floor(Math.random() * FUNNY_QUOTES.length);
    setMessage(FUNNY_QUOTES[randomIndex]);
    setIsHovered(true); 
  };

  return (
    <div className="flex justify-end items-center px-8 pt-2 bg-[#FAF9F5]">
      <div className="relative">
        <button
          className="w-12 right-5 fixed h-6 focus:outline-none"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onClick={handleGhostClick} 
        >
          <Lottie className='w-8' animationData={ghostAnimation} loop={true} />
        </button>

        {/* Tooltip */}
        {isHovered && (
          <div className="fixed right-20 top-8 w-72 bg-gray-900 text-white text-sm rounded-lg px-4 py-3 shadow-xl z-50">
            <p className="leading-relaxed">
              {message}
            </p>
            {/* Arrow pointer */}
            <div className="absolute top-1/2 -right-2 w-0 h-0 border-l-4 border-t-2 border-b-2 border-l-gray-900 border-t-transparent border-b-transparent transform -translate-y-1/2"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Navbar;