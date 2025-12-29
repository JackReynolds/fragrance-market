"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "../../firebase.config";
import {
  addDoc,
  collection,
  serverTimestamp,
  query,
  where,
  getDocs,
} from "firebase/firestore"; // Add for count check
import { toast } from "sonner";
// import { Navigation } from "@/components/ui/navigation.jsx";
// import { Footer } from "@/components/ui/footer.jsx";
import { Button } from "@/components/ui/button.jsx";
import { Input } from "@/components/ui/input.jsx";
import { Label } from "@/components/ui/label.jsx";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card.jsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.jsx";
import { Textarea } from "@/components/ui/textarea.jsx";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command.jsx";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover.jsx";
import {
  Camera,
  Upload,
  PlusCircle,
  Trash2,
  Sparkles,
  EuroIcon,
  Check,
  ChevronsUpDown,
  Plus,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useProfileDoc } from "@/hooks/useProfileDoc";
import { generateSlug } from "@/utils/generateSlug";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog.jsx";

const NewListing = () => {
  const { authUser, authLoading } = useAuth();
  const router = useRouter();
  const [imageFiles, setImageFiles] = useState([]);
  const [imageURLs, setImageURLs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [brandOpen, setBrandOpen] = useState(false);
  const [customBrand, setCustomBrand] = useState("");
  const [showCustomBrand, setShowCustomBrand] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [currentListingCount, setCurrentListingCount] = useState(0);

  const { profileDoc } = useProfileDoc();

  // Check listing limit on page load
  useEffect(() => {
    const checkListingLimit = async () => {
      if (!authUser?.uid || !profileDoc) return;

      // If user is premium, no limits
      if (profileDoc.isPremium) return;

      try {
        // Get current active listing count
        const listingsRef = collection(db, "listings");
        const q = query(
          listingsRef,
          where("ownerUid", "==", authUser.uid),
          where("status", "==", "active")
        );

        const querySnapshot = await getDocs(q);
        const count = querySnapshot.size;
        setCurrentListingCount(count);

        // Show modal if at limit
        if (count >= 3) {
          setShowLimitModal(true);
        }
      } catch (error) {
        console.error("Error checking listing count:", error);
      }
    };

    if (!authLoading && authUser && profileDoc) {
      checkListingLimit();
    }
  }, [authUser, authLoading, profileDoc]);

  const brands = [
    "100 Bon",
    "3B International",
    "4711",
    "Acca Kappa",
    "Accendis",
    "Acqua Di Parma",
    "Adam Levine",
    "Adidas",
    "Adnan B.",
    "Adrienne Vittadini",
    "Aerie",
    "Aeropostale",
    "Afan",
    "Affinessence",
    "Afnan",
    "Agatha Ruiz De La Prada",
    "Agent Provocateur",
    "Ahmed Al Maghribi",
    "Ajmal",
    "Al Haramain",
    "Al Wataniah",
    "Al Zaafaran",
    "Alberta Ferretti",
    "Alessandro Dell Acqua",
    "Alexandre J",
    "Alfa Romeo",
    "Alfred Dunhill",
    "Alfred Sung",
    "Alyson Oldoini",
    "Alyssa Ashley",
    "Amouage",
    "Amouroud",
    "Andy Hilfiger",
    "Anfar",
    "Angel Schlesser",
    "Angelina",
    "Animale",
    "Anna Sui",
    "Anne Klein",
    "Annick Goutal",
    "Antonio Banderas",
    "Antonio Puig",
    "Aquolina",
    "Arabian Oud",
    "Arabiyat Prestige",
    "Aramis",
    "Ariana Grande",
    "Armaf",
    "Armand Basi",
    "Artes Florales",
    "Atelier Bloem",
    "Atelier Cologne",
    "Atelier Des Ors",
    "Atkinsons",
    "Attar Collection",
    "Au Pays De La Fleur D’oranger",
    "Aubusson",
    "Avon",
    "Azha",
    "Azzaro",
    "BDK Parfums",
    "Badgley Mischka",
    "Banana Republic",
    "Barbour",
    "Bath & Body Works",
    "Bebe",
    "Bellevue Brands",
    "Benetton",
    "Bentley",
    "Berdoues",
    "Betsey Johnson",
    "Bharara Beauty",
    "Bill Blass",
    "Blumarine Parfums",
    "Bob Mackie",
    "Bois 1920",
    "Bond No. 9",
    "Borouj",
    "Bottega Veneta",
    "Boucheron",
    "Brioni",
    "Brosseau",
    "Burberry",
    "Bvlgari",
    "Byblos",
    "Byredo",
    "Cabochard",
    "Cacharel",
    "Caesars",
    "Calvin Klein",
    "Calypso Christiane Celle",
    "Canali",
    "Capcom",
    "Capucci",
    "Carla Fracci",
    "Carlo Corinto",
    "Carlos Campos",
    "Carlos Santana",
    "Carner Barcelona",
    "Carolina Herrera",
    "Caron",
    "Cartier",
    "Carven",
    "Catherine Malandrino",
    "Celine Dion",
    "Chanel",
    "Chantal Thomass",
    "Charles Jourdan",
    "Chaugan",
    "Cher",
    "Chevignon",
    "Chkoudra Paris",
    "Chloe",
    "Chopard",
    "Christian Audigier",
    "Christian Dior",
    "Christian Lacroix",
    "Christian Louboutin",
    "Christian Siriano",
    "Cigar",
    "Cindy Crawford",
    "Clean",
    "Clinique",
    "Clive Christian",
    "Coach",
    "Cofinluxe",
    "Comptoir Sud Pacifique",
    "Coquillete",
    "Coty",
    "Courreges",
    "Creed",
    "Cuba",
    "Cubano",
    "D.S. & Durga",
    "Dali Haute Parfumerie",
    "Dana",
    "Davidoff",
    "Dejavu",
    "Demeter",
    "Derek Lam 10 Crosby",
    "Diana Vreeland",
    "Diane Von Furstenberg",
    "Diesel",
    "Diptyque",
    "Dolce & Gabbana",
    "Dolce Donna",
    "Donna Karan",
    "Dorin",
    "Dr Teal's",
    "Dsquared2",
    "Dumont Paris",
    "Eight & Bob",
    "El Ganso",
    "Elie Saab",
    "Elizabeth And James",
    "Elizabeth Arden",
    "Elizabeth Taylor",
    "Ellen Tracy",
    "Emor London",
    "Enrico Gi",
    "Enzo Galardi",
    "Erox",
    "Escada",
    "Escentric Molecules",
    "Essenza",
    "Estee Lauder",
    "Estelle Vendome",
    "Etat Libre d'Orange",
    "Etienne Aigner",
    "Etro",
    "Euroitalia",
    "Everlast",
    "Evody Parfums",
    "Evyan",
    "Faberge",
    "Faconnable",
    "Fanette",
    "Fariis Parfum",
    "Ferrari",
    "Fila",
    "Floris",
    "Franck Boclet",
    "Franck Olivier",
    "Fred Hayman",
    "Frederic Malle",
    "French Connection",
    "Gabriela Sabatini",
    "Gabriele Strehle",
    "Galanos",
    "Gale Hayman",
    "Gap",
    "Geir Ness",
    "Geoffrey Beene",
    "Ghost",
    "Giardino Benessere",
    "Gilles Cantuel",
    "Giorgio Armani",
    "Giorgio Beverly Hills",
    "Giorgio Valenti",
    "Gisada",
    "Givenchy",
    "Glenn Perri",
    "Gloria Vanderbilt",
    "Goldfield & Banks",
    "Gritti",
    "Gucci",
    "Guerlain",
    "Guess",
    "Guy Laroche",
    "Gwen Stefani",
    "Halston",
    "Hamidi",
    "Harve Benard",
    "Haute & Chic",
    "Hayari",
    "Hayley Kiyoko",
    "Head",
    "Hermes",
    "Hermetica",
    "Histoires De Parfums",
    "Hollister",
    "Houbigant",
    "House Of Sillage",
    "Hugo Boss",
    "Iceberg",
    "Ikks",
    "Ilana Jivago",
    "Illuminum",
    "Initio Parfums Prives",
    "Issey Miyake",
    "Izod",
    "J.Crew",
    "J.Dessange",
    "Jacadi",
    "Jacomo",
    "Jacques Bogart",
    "James Galann",
    "Jason Wu",
    "Jean Desprez",
    "Jean Feraud",
    "Jean Louis Scherrer",
    "Jean Patou",
    "Jean Paul Gaultier",
    "Jean Philippe",
    "Jeanne Arthes",
    "Jeroboam",
    "Jesus Del Pozo",
    "Jil Sander",
    "Jimmy Choo",
    "Jo Malone",
    "Jo Milano",
    "Joe Winn",
    "John Varvatos",
    "Joop!",
    "Jordache",
    "Jordan Outdoor",
    "Joseph Abboud",
    "Joseph Jivago",
    "Joseph Prive",
    "Jovan",
    "Jovoy",
    "Judith Leiber",
    "Judith Ripka",
    "Juicy Couture",
    "Jul Et Mad Paris",
    "Juliette Has A Gun",
    "Kajal",
    "Kaloo",
    "Kanon",
    "Karl Lagerfeld",
    "Kat Von D",
    "Kate Spade",
    "Keiko Mecheri",
    "Kemi Blending Magic",
    "Kenneth Cole",
    "Kensie",
    "Kenzo",
    "Khadlaj",
    "Khususi",
    "Kian",
    "Kilian",
    "Kn95",
    "Korloff",
    "Kraft",
    "Krizia",
    "LT Piver",
    "La Martina",
    "La Perla",
    "La Rive",
    "Lacoste",
    "Lalique",
    "Lancaster",
    "Lancome",
    "Lanvin",
    "Lapidus",
    "Lattafa",
    "Laura Biagiotti",
    "Laurent Mazzone",
    "Lavanila",
    "Le Gazelle",
    "Le Labo",
    "Le Luxe",
    "Leiber",
    "Lengling Munich",
    "Leonard",
    "Lilian Barony",
    "Linari",
    "Liquides Imaginaires",
    "Liz Claiborne",
    "Loewe",
    "Lolita Lempicka",
    "Lomani",
    "Lorenzo Villoresi",
    "Louis Vuitton",
    "Ltl",
    "Luciano Pavarotti",
    "Luciano Soprani",
    "Lulu Castagnette",
    "Lulu Guinness",
    "M. Micallef",
    "Maison Alhambra",
    "Maison Crivelli",
    "Maison De l'Avenir",
    "Maison Francis Kurkdjian",
    "Maison Margiela",
    "Maison Noir",
    "Majda Bekkali",
    "Mally",
    "Mancera",
    "Mandarina Duck",
    "Marc Ecko",
    "Marc Jacobs",
    "Marc Joseph",
    "Marcella Borghese",
    "Maria Candida Gentile",
    "Marilyn Miglin",
    "Marina De Bourbon",
    "Marlo Cosmetics",
    "Marmol & Son",
    "Masaki Matsushima",
    "Masque Milano",
    "Mauboussin",
    "Maurer & Wirtz",
    "Max Azria",
    "Max Deville",
    "Maxims",
    "Memo",
    "Memoire Archives",
    "Mercedes Benz",
    "Merve",
    "Michael Kors",
    "Michael Malul",
    "Michel Germain",
    "Mick Micheyl",
    "Min New York",
    "Mind Games",
    "Missguided",
    "Missoni",
    "Miu Miu",
    "Molinard",
    "Molton Brown",
    "Molyneux",
    "Moncler",
    "Monotheme",
    "Mont Blanc",
    "Montale",
    "Montana",
    "Moresque",
    "Moschino",
    "Muelhens",
    "Myrurgia",
    "Nanette Lepore",
    "Narciso Rodriguez",
    "Nasomatto",
    "Nautica",
    "Nejma",
    "Nicolai",
    "Nicolai Baron Atelier",
    "Nicole Miller",
    "Nina Ricci",
    "Nino Cerruti",
    "Nishane",
    "Nobile 1942",
    "Nostrum",
    "Nu Parfums",
    "Nusuk",
    "Old Spice",
    "Olfactive Studio",
    "Omanluxury",
    "Onyrico",
    "Orientica",
    "Original Penguin",
    "Orlov Paris",
    "Orto Parisi",
    "Oscar De La Renta",
    "Otto Kern",
    "Paco Rabanne",
    "Pal Zileri",
    "Paloma Picasso",
    "Parfum Blaze",
    "Parfums De Coeur",
    "Parfums De Marly",
    "Parfums Gres",
    "Parfums Jacques Evard",
    "Parfums Lively",
    "Parfums Rivera",
    "Parisis Parfums",
    "Parlux",
    "Pascal Morabito",
    "Paul Sebastian",
    "Paul Smith",
    "Penhaligon's",
    "Penthouse",
    "Pepe Jeans London",
    "Perfumers Workshop",
    "Perry Ellis",
    "Philipp Plein Parfums",
    "Philippe Venet",
    "Philosophy",
    "Phuong Dang",
    "Pierre Balmain",
    "Pierre Cardin",
    "Pino Silvestre",
    "Piver",
    "Plume Impression",
    "Prada",
    "Prince Matchabelli",
    "Proenza Schouler",
    "Puig",
    "Quicksilver",
    "Ralph Lauren",
    "Rance",
    "Rasasi",
    "Reebok",
    "Reem Acra",
    "Reminiscence",
    "Remy Latour",
    "Reporter",
    "Revlon",
    "Reyane Tradition",
    "Rich & Ruitz",
    "Richard James",
    "Robert Graham",
    "Robert Piguet",
    "Roberto Cavalli",
    "Roberto Verino",
    "Roberto Vizzari",
    "Roccobarocco",
    "Rochas",
    "Rodin",
    "Roger & Gallet",
    "Roja Parfums",
    "Romeo Gigli",
    "Roos & Roos",
    "Royal Copenhagen",
    "Royall Fragrances",
    "Saint Hilaire",
    "Sakamichi",
    "Salvatore Ferragamo",
    "Sapil",
    "Sarah Jessica Parker",
    "Sawalef",
    "Scentstory",
    "Scotch & Soda",
    "Seksy",
    "Selectiva SPA",
    "Serge Lutens",
    "Sergio Tacchini",
    "Shiseido",
    "Simone Cosac Profumi",
    "Sisley",
    "Sol De Janeiro",
    "Sonia Rykiel",
    "Sospiro",
    "St Dupont",
    "Starck Paris",
    "Starter",
    "State Of Mind",
    "Stella Cadente",
    "Stella McCartney",
    "Succes De Paris",
    "Swiss Arabian",
    "Swiss Army",
    "Swiss Guard",
    "Talbot Runhof",
    "Talpa Global",
    "Tanya Sarne",
    "Ted Lapidus",
    "Tequila Perfumes",
    "Texas Rangers",
    "Thalia Sodi",
    "The Different Company",
    "The House Of Oud",
    "The Merchant Of Venice",
    "The Spirit Of Dubai",
    "The Woods Collection",
    "Thierry Mugler",
    "Thomas Kosmala",
    "Tiffany",
    "Tiziana Terenzi",
    "Tocca",
    "Todd Oldham",
    "Tom Ford",
    "Tommi Sooni",
    "Tommy Bahama",
    "Tommy Hilfiger",
    "Tonino Lamborghini",
    "Torand",
    "Tory Burch",
    "Tous",
    "Tresor",
    "Trojan",
    "True Religion",
    "Trussardi",
    "Tumi",
    "Ungaro",
    "V Canto",
    "Valentino",
    "Van Cleef & Arpels",
    "Vapro International",
    "Vera Wang",
    "Versace",
    "Versens",
    "Vert",
    "Vertus",
    "Vicky Tiel",
    "Victor Manuelle",
    "Victoria's Secret",
    "Victorinox",
    "Victory International",
    "Viktor & Rolf",
    "Vince Camuto",
    "Visconte Di Modrone",
    "Viviane Vendelle",
    "Volnay",
    "Vurv",
    "Weil",
    "Widian",
    "Wildfox",
    "William Rast",
    "Woods Of Windsor",
    "Xerjoff",
    "YZY Perfume",
    "Yardley London",
    "Yohji Yamamoto",
    "Yves De Sistelle",
    "Yves Saint Laurent",
    "Zadig & Voltaire",
    "Zara",
    "Zirh International",
  ];

  // Form state
  const [formData, setFormData] = useState({
    type: "swap",
    description: "",
    price: "",
    currency: "EUR",
    amount: "100",
    brand: "",
    fragrance: "",
    size: "",
    swapPreferences: "",
  });

  // Form validation
  const [errors, setErrors] = useState({});

  // Redirect to login if not authenticated or email isn't verified
  useEffect(() => {
    if (!authLoading && !authUser) {
      toast.error("Please sign in to create a listing");
      router.push("/sign-in");
    } else if (authUser && !authUser.emailVerified) {
      toast.error("Please verify your email to create a listing");
      router.push("/");
    }
  }, [authUser, authLoading]);

  // Load Cloudinary widget script
  useEffect(() => {
    loadCloudinaryScript(() => {});
  }, []);

  const loadCloudinaryScript = (callback) => {
    const existingScript = document.getElementById("cloudinaryWidgetScript");
    if (!existingScript) {
      const script = document.createElement("script");
      script.src = "https://widget.cloudinary.com/v2.0/global/all.js";
      script.id = "cloudinaryWidgetScript";
      document.body.appendChild(script);
      script.onload = () => {
        if (callback) callback();
      };
    } else if (callback) {
      callback();
    }
  };

  const cloudName = "prodcloudinary";
  const uploadPreset = "fragrance-market";

  const openUploadWidget = () => {
    window.cloudinary
      .createUploadWidget(
        {
          cloudName: cloudName,
          uploadPreset: uploadPreset,
          multiple: true,
          maxFiles: 5 - imageFiles.length,
          sources: ["local", "camera"],
          folder: "fragrance-market/listings",
          context: {
            alt: "user_uploaded_image",
            caption: "Uploaded on Fragrance Market",
          },
          resourceType: "image",
        },
        (error, result) => {
          if (!error && result && result.event === "success") {
            setImageFiles((prevFiles) => [...prevFiles, result.info]);
            setImageURLs((prevUrls) => [...prevUrls, result.info.secure_url]);
          } else if (error) {
            console.error("Cloudinary upload error:", error);
            toast.error("Failed to upload image. Please try again.");
          }
        }
      )
      .open();
  };

  const removeImage = (index) => {
    setImageFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
    setImageURLs((prevUrls) => prevUrls.filter((_, i) => i !== index));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing again
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user makes a selection
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const handleBrandSelect = (selectedBrand) => {
    setFormData((prev) => ({
      ...prev,
      brand: selectedBrand,
    }));
    setBrandOpen(false);
    setShowCustomBrand(false);
    setCustomBrand("");

    // Clear error when user makes a selection
    if (errors.brand) {
      setErrors((prev) => ({
        ...prev,
        brand: undefined,
      }));
    }
  };

  const handleCustomBrandSubmit = () => {
    if (customBrand.trim()) {
      setFormData((prev) => ({
        ...prev,
        brand: customBrand.trim(),
      }));
      setBrandOpen(false);
      setShowCustomBrand(false);
      setCustomBrand("");

      // Clear error when user adds custom brand
      if (errors.brand) {
        setErrors((prev) => ({
          ...prev,
          brand: undefined,
        }));
      }
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.brand.trim()) {
      newErrors.brand = "Brand is required";
    }

    if (!formData.fragrance.trim()) {
      newErrors.fragrance = "Fragrance name is required";
    }

    const sizeNum = Number(formData.size);
    if (
      !formData.size ||
      !Number.isFinite(sizeNum) ||
      sizeNum < 1 ||
      sizeNum > 500
    ) {
      newErrors.size = "Please enter a valid bottle size (1-500ml)";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    }

    if (
      formData.type === "sell" &&
      (!formData.price ||
        isNaN(parseFloat(formData.price)) ||
        parseFloat(formData.price) <= 0)
    ) {
      newErrors.price = "Valid price is required for items for sale";
    }

    if (imageURLs.length === 0) {
      newErrors.images = "At least one image is required";
    }

    if (formData.type === "swap" && !formData.swapPreferences.trim()) {
      newErrors.swapPreferences =
        "Please specify what you're looking to swap for";
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errors = validateForm();
    if (Object.keys(errors).length) {
      setErrors(errors);
      const first = document.getElementById(Object.keys(errors)[0]);
      if (first) first.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    if (!authUser || !profileDoc) {
      toast.error("Your profile is still loading. Please try again.");
      return;
    }

    // Validate sell listing requirements
    if (formData.type === "sell") {
      if (!profileDoc.isPremium) {
        toast.error("Premium membership required to sell fragrances.");
        return;
      }
      if (!profileDoc.isIdVerified) {
        toast.error(
          "ID verification required to sell fragrances. Please verify your identity in your profile."
        );
        return;
      }
      if (profileDoc.stripeAccountStatus?.statusCode !== 1) {
        toast.error(
          "Complete Stripe setup required to sell fragrances. Please set up payments in your profile."
        );
        return;
      }
      if (!formData.currency) {
        toast.error("Please choose a currency.");
        return;
      }
    }

    setIsLoading(true);
    try {
      // Safe price parsing → cents (avoid float issues)
      const priceNumber =
        formData.type === "sell"
          ? Number(String(formData.price).replace(",", "."))
          : null;
      const priceCents =
        formData.type === "sell" ? Math.round(priceNumber * 100) : null;

      if (
        formData.type === "sell" &&
        (!Number.isFinite(priceCents) || priceCents <= 0)
      ) {
        toast.error("Please enter a valid price.");
        setIsLoading(false);
        return;
      }

      // amountLeft sanity check
      const amountLeft = Number(formData.amount);
      if (!Number.isFinite(amountLeft) || amountLeft < 0) {
        toast.error("Please enter a valid amount left.");
        setIsLoading(false);
        return;
      }

      // Auto-generate title from fragrance and brand
      const generatedTitle = `${formData.fragrance.trim()} - ${formData.brand.trim()}`;

      // Generate SEO-friendly slug for the listing
      const slug = generateSlug(generatedTitle);

      const listingData = {
        title: generatedTitle,
        slug,
        type: formData.type,
        description: formData.description.trim(),
        priceCents,
        amountLeft,
        brand: formData.brand.trim(),
        fragrance: formData.fragrance.trim(),
        sizeInMl: Number(formData.size),
        swapPreferences:
          formData.type === "swap" ? formData.swapPreferences.trim() : null,
        imageURLs,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        status: "active",
        ownerUid: authUser.uid,
        ownerUsername:
          (profileDoc && profileDoc.username) ||
          authUser.displayName ||
          "Anonymous User",
        ownerProfilePictureURL:
          (profileDoc && profileDoc.profilePictureURL) || null,
        country: (profileDoc && profileDoc.country) || null,
        countryCode: (profileDoc && profileDoc.countryCode) || null,
      };

      if (formData.type === "sell") {
        listingData.currency = formData.currency.toLowerCase();
      }

      const docRef = await addDoc(collection(db, "listings"), listingData);
      toast.success("Listing created successfully!");
      router.push(`/listings/${slug}`);
    } catch (err) {
      console.error("Error creating listing:", err);
      toast.error("Failed to create listing. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state
  if (authLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-pulse text-xl">Loading...</div>
        </main>
      </div>
    );
  }

  // Not authenticated
  if (!authUser) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Listing Limit Modal */}
      <Dialog
        open={showLimitModal}
        onOpenChange={(open) => {
          if (!open) {
            setShowLimitModal(false);
            router.push("/");
          }
        }}
      >
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">Listing Limit Reached</DialogTitle>
            <DialogDescription>
              Standard accounts can have up to 3 active listings at a time.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Current Status */}
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-md">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                <p className="font-medium text-amber-800">
                  You currently have {currentListingCount}/3 active listings
                </p>
              </div>
              <p className="text-sm text-amber-700">
                To create a new listing, you&apos;ll need to either remove an
                existing one or upgrade to Premium.
              </p>
            </div>

            {/* Options */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">
                    Option 1: Manage Existing Listings
                  </h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Remove or complete swaps for current listings to free up
                    space.
                  </p>
                  <Button
                    variant="outline"
                    className="w-full hover:cursor-pointer"
                    onClick={() => {
                      setShowLimitModal(false);
                      router.push("/my-profile");
                    }}
                  >
                    Manage My Listings
                  </Button>
                </div>

                <div className="p-4 border rounded-lg bg-primary/5">
                  <h4 className="font-medium mb-2">
                    Option 2: Upgrade to Premium
                  </h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Get unlimited listings plus exclusive benefits.
                  </p>

                  <Button
                    className="w-full hover:cursor-pointer"
                    onClick={() => router.push("/premium")}
                  >
                    See Premium Benefits
                  </Button>
                </div>
              </div>
            </div>

            {/* Premium Benefits Preview */}
            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Premium Account Benefits:</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  <span>Unlimited listings</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  <span>Unlimited swaps</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  <span>Sell fragrances</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  <span>Priority search ranking</span>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="default"
              className="hover:cursor-pointer"
              onClick={() => {
                setShowLimitModal(false);
                router.push("/");
              }}
            >
              Go to Homepage
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Full Width Header */}
      <div className="relative py-8 md:py-12">
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(269deg, rgba(31, 114, 90, 1) 0%, rgba(22, 102, 79, 1) 41%, rgba(29, 35, 45, 1) 100%)",
          }}
        ></div>
        <div className="relative container px-4 md:px-6 mx-auto">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-xl md:text-3xl font-bold mb-4 text-white">
              Create New Listing
            </h1>
            <p className="text-xs md:text-base text-white/90">
              Share your fragrance with the community. Provide clear details to
              attract interested buyers or swappers.
            </p>
          </div>
        </div>

        {/* Optional: Add some decorative elements */}
        <div className="absolute inset-0 bg-black/5"></div>
      </div>

      <main className="flex justify-center py-8 md:py-12">
        <div className="container px-4 md:px-6">
          <div className="max-w-3xl mx-auto">
            <form onSubmit={handleSubmit}>
              <div className="space-y-8">
                {/* Basic Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg md:text-xl">
                      Basic Information
                    </CardTitle>
                    <CardDescription>
                      Enter the details about your fragrance listing
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="brand">Brand/House</Label>
                        <Popover open={brandOpen} onOpenChange={setBrandOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              id="brand"
                              variant="outline"
                              role="combobox"
                              aria-expanded={brandOpen}
                              className={cn(
                                "w-full justify-between hover:cursor-pointer",
                                !formData.brand && "text-muted-foreground",
                                errors.brand && "border-destructive"
                              )}
                            >
                              {formData.brand || "Select a brand..."}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-full p-0">
                            <Command>
                              <CommandInput placeholder="Search brands..." />
                              <CommandList>
                                <CommandEmpty>
                                  <div className="p-2 text-center">
                                    <p className="text-sm text-muted-foreground mb-2">
                                      No brand found.
                                    </p>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        setShowCustomBrand(true);
                                        setBrandOpen(false);
                                      }}
                                      className="w-full"
                                    >
                                      <Plus className="mr-2 h-4 w-4" />
                                      Add Brand
                                    </Button>
                                  </div>
                                </CommandEmpty>
                                <CommandGroup>
                                  {brands.map((brand) => (
                                    <CommandItem
                                      key={brand}
                                      value={brand}
                                      onSelect={() => handleBrandSelect(brand)}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          formData.brand === brand
                                            ? "opacity-100"
                                            : "opacity-0"
                                        )}
                                      />
                                      {brand}
                                    </CommandItem>
                                  ))}
                                  <CommandItem
                                    onSelect={() => {
                                      setShowCustomBrand(true);
                                      setBrandOpen(false);
                                    }}
                                    className="text-primary"
                                  >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Brand
                                  </CommandItem>
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>

                        {/* Custom Brand Input */}
                        {showCustomBrand && (
                          <div className="space-y-2 p-3 border rounded-md bg-muted/50">
                            <Label htmlFor="customBrand">
                              Brand/House Name
                            </Label>
                            <div className="flex gap-2">
                              <Input
                                id="customBrand"
                                placeholder="Enter name..."
                                value={customBrand}
                                onChange={(e) => setCustomBrand(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    handleCustomBrandSubmit();
                                  }
                                }}
                              />
                              <Button
                                type="button"
                                onClick={handleCustomBrandSubmit}
                                disabled={!customBrand.trim()}
                              >
                                Add
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                  setShowCustomBrand(false);
                                  setCustomBrand("");
                                }}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        )}

                        {errors.brand && (
                          <p className="text-sm text-destructive">
                            {errors.brand}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="fragrance">Fragrance Name</Label>
                        <Input
                          id="fragrance"
                          name="fragrance"
                          placeholder="E.g., Oud Wood, Aventus, Sauvage"
                          value={formData.fragrance}
                          onChange={handleChange}
                          className={
                            errors.fragrance ? "border-destructive" : ""
                          }
                        />
                        {errors.fragrance && (
                          <p className="text-sm text-destructive">
                            {errors.fragrance}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="size">Bottle Size (ml)</Label>
                      <Input
                        id="size"
                        name="size"
                        type="number"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        min="1"
                        max="500"
                        placeholder="E.g., 50, 100, 125"
                        value={formData.size}
                        onChange={handleChange}
                        className={errors.size ? "border-destructive" : ""}
                      />
                      {errors.size && (
                        <p className="text-sm text-destructive">
                          {errors.size}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        name="description"
                        placeholder="Describe your fragrance - include details like batch code, year of production, storage conditions, etc."
                        rows={4}
                        value={formData.description}
                        onChange={handleChange}
                        className={
                          errors.description ? "border-destructive" : ""
                        }
                      />
                      {errors.description && (
                        <p className="text-sm text-destructive">
                          {errors.description}
                        </p>
                      )}
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="type">Listing Type</Label>
                        <Select
                          value={formData.type}
                          onValueChange={(value) =>
                            handleSelectChange("type", value)
                          }
                        >
                          <SelectTrigger
                            id="type"
                            className={errors.type ? "border-destructive" : ""}
                          >
                            <SelectValue placeholder="Select listing type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="swap">
                              <div className="flex items-center">
                                <Sparkles className="mr-2 h-4 w-4" />
                                <span>Swap</span>
                              </div>
                            </SelectItem>
                            {/* Check all requirements for selling */}
                            {profileDoc?.isPremium &&
                            profileDoc?.isIdVerified &&
                            profileDoc?.stripeAccountStatus?.statusCode ===
                              1 ? (
                              <SelectItem value="sell">
                                <div className="flex items-center">
                                  <EuroIcon className="mr-2 h-4 w-4" />
                                  <span>Sell</span>
                                </div>
                              </SelectItem>
                            ) : !profileDoc?.isPremium ? (
                              <SelectItem value="sell" disabled>
                                <div className="flex items-center text-muted-foreground">
                                  <EuroIcon className="mr-2 h-4 w-4" />
                                  <span>Sell (Premium Only)</span>
                                </div>
                              </SelectItem>
                            ) : (
                              <SelectItem value="sell">
                                <div className="flex items-center text-muted-foreground">
                                  <EuroIcon className="mr-2 h-4 w-4" />
                                  <span>Sell (Complete setup to enable)</span>
                                </div>
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        {errors.type && (
                          <p className="text-sm text-destructive">
                            {errors.type}
                          </p>
                        )}

                        {/* Show upgrade message for non-premium users */}
                        {!profileDoc?.isPremium && formData.type !== "sell" && (
                          <div className="mt-3 p-4 border border-primary/20 bg-primary/5 rounded-md">
                            <h4 className="font-semibold text-sm mb-2">
                              Want to sell fragrances?
                            </h4>
                            <p className="text-xs text-muted-foreground mb-3">
                              Upgrade to Premium to unlock the ability to sell
                              your fragrances directly on the marketplace.
                            </p>
                            <Button
                              size="sm"
                              className="w-full hover:cursor-pointer"
                              onClick={() => window.open("/premium", "_blank")}
                              type="button"
                            >
                              View Premium Benefits
                            </Button>
                          </div>
                        )}

                        {/* Show requirements card ONLY when sell is selected and requirements aren't met */}
                        {formData.type === "sell" &&
                          !(
                            profileDoc?.isPremium &&
                            profileDoc?.isIdVerified &&
                            profileDoc?.stripeAccountStatus?.statusCode === 1
                          ) && (
                            <div className="mt-3 p-4 border border-amber-200 bg-amber-50 rounded-md">
                              <h4 className="font-semibold text-sm mb-3 text-amber-900">
                                ⚠️ Requirements to Sell
                              </h4>
                              <p className="text-xs text-amber-700 mb-3">
                                Complete the following to create sell listings:
                              </p>
                              <div className="space-y-3">
                                {/* Premium Check */}
                                {!profileDoc?.isPremium && (
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1">
                                      <p className="text-sm text-amber-800 font-medium">
                                        • Premium Membership
                                      </p>
                                      <p className="text-xs text-amber-700 mt-1">
                                        Upgrade to unlock selling features
                                      </p>
                                    </div>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="hover:cursor-pointer shrink-0"
                                      onClick={() => router.push("/premium")}
                                      type="button"
                                    >
                                      Upgrade
                                    </Button>
                                  </div>
                                )}

                                {/* ID Verification Check */}
                                {profileDoc?.isPremium &&
                                  !profileDoc?.isIdVerified && (
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="flex-1">
                                        <p className="text-sm text-amber-800 font-medium">
                                          • ID Verification
                                        </p>
                                        <p className="text-xs text-amber-700 mt-1">
                                          Verify your identity to sell
                                        </p>
                                      </div>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="hover:cursor-pointer shrink-0"
                                        onClick={() =>
                                          router.push("/my-profile")
                                        }
                                        type="button"
                                      >
                                        Verify ID
                                      </Button>
                                    </div>
                                  )}

                                {/* Stripe Onboarding Check */}
                                {profileDoc?.isPremium &&
                                  profileDoc?.isIdVerified &&
                                  profileDoc?.stripeAccountStatus
                                    ?.statusCode !== 1 && (
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="flex-1">
                                        <p className="text-sm text-amber-800 font-medium">
                                          • Payment Setup
                                        </p>
                                        <p className="text-xs text-amber-700 mt-1">
                                          {profileDoc?.stripeAccountStatus
                                            ?.statusCode === 2
                                            ? "Complete Stripe requirements"
                                            : profileDoc?.stripeAccountStatus
                                                ?.statusCode === 3
                                            ? "Finish Stripe onboarding"
                                            : "Set up payment processing"}
                                        </p>
                                      </div>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="hover:cursor-pointer shrink-0"
                                        onClick={() =>
                                          router.push("/my-profile")
                                        }
                                        type="button"
                                      >
                                        Set Up
                                      </Button>
                                    </div>
                                  )}
                              </div>
                            </div>
                          )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="amount">Amount Left</Label>
                        <Select
                          value={formData.amount}
                          onValueChange={(value) =>
                            handleSelectChange("amount", value)
                          }
                        >
                          <SelectTrigger
                            id="amount"
                            className={
                              errors.amount ? "border-destructive" : ""
                            }
                          >
                            <SelectValue placeholder="Select amount left" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="100">
                              100% (Full/Unused)
                            </SelectItem>
                            <SelectItem value="99">
                              99% (Tested only)
                            </SelectItem>
                            <SelectItem value="95">
                              95% (Few sprays used)
                            </SelectItem>
                            <SelectItem value="90">90%</SelectItem>
                            <SelectItem value="85">85%</SelectItem>
                            <SelectItem value="80">80%</SelectItem>
                            <SelectItem value="75">75%</SelectItem>
                            <SelectItem value="70">70%</SelectItem>
                            <SelectItem value="60">60%</SelectItem>
                            <SelectItem value="50">50%</SelectItem>
                            <SelectItem value="40">40%</SelectItem>
                            <SelectItem value="30">30%</SelectItem>
                            <SelectItem value="20">20%</SelectItem>
                            <SelectItem value="10">10% or less</SelectItem>
                          </SelectContent>
                        </Select>
                        {errors.amount && (
                          <p className="text-sm text-destructive">
                            {errors.amount}
                          </p>
                        )}
                      </div>
                    </div>

                    {formData.type === "sell" && (
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="price">Price </Label>
                          <div className="relative">
                            <Input
                              id="price"
                              name="price"
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="0.00"
                              value={formData.price}
                              onChange={handleChange}
                              className={`pl-4 ${
                                errors.price ? "border-destructive" : ""
                              }`}
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="currency">Currency </Label>
                          <Select
                            value={formData.currency}
                            onValueChange={(value) =>
                              handleSelectChange("currency", value)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select currency" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="EUR">EUR</SelectItem>
                              <SelectItem value="USD">USD</SelectItem>
                              <SelectItem value="GBP">GBP</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {errors.price && (
                          <p className="text-sm text-destructive">
                            {errors.price}
                          </p>
                        )}
                      </div>
                    )}

                    {formData.type === "swap" && (
                      <div className="space-y-2">
                        <Label htmlFor="swapPreferences">
                          What are you looking to swap for?
                        </Label>
                        <Textarea
                          id="swapPreferences"
                          name="swapPreferences"
                          placeholder="Describe the fragrances you're interested in swapping for - brands, specific fragrances, etc."
                          rows={3}
                          value={formData.swapPreferences}
                          onChange={handleChange}
                          className={
                            errors.swapPreferences ? "border-destructive" : ""
                          }
                        />
                        {errors.swapPreferences && (
                          <p className="text-sm text-destructive">
                            {errors.swapPreferences}
                          </p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Images */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg md:text-xl">Images</CardTitle>
                    <CardDescription>
                      Upload clear photos of your fragrance. Show the bottle,
                      box, fill level, and batch code if possible.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {imageURLs.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                          {imageURLs.map((url, index) => (
                            <div
                              key={index}
                              className="relative aspect-square rounded-md overflow-hidden border bg-muted"
                            >
                              <Image
                                src={url}
                                alt={`Listing image ${index + 1}`}
                                fill
                                className="object-cover"
                              />
                              <button
                                type="button"
                                onClick={() => removeImage(index)}
                                className="absolute top-2 right-2 bg-white/80 backdrop-blur-sm p-1 rounded-full text-destructive hover:bg-white"
                                aria-label="Remove image"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          ))}

                          {imageURLs.length < 5 && (
                            <button
                              type="button"
                              onClick={openUploadWidget}
                              className="flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/20 rounded-md aspect-square text-muted-foreground hover:bg-muted/50 transition-colors"
                            >
                              <PlusCircle className="mb-2" />
                              <span>Add More</span>
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-muted-foreground/20 rounded-md text-center">
                          <Upload className="h-10 w-10 text-muted-foreground mb-4" />
                          <h3 className="font-medium mb-1">Upload Images</h3>
                          <p className="text-sm text-muted-foreground mb-4">
                            Click to upload (max 5 images)
                          </p>
                          <Button
                            type="button"
                            onClick={openUploadWidget}
                            className="flex items-center hover:cursor-pointer hover:bg-primary/80 shadow-md"
                          >
                            <Camera className="mr-2 h-4 w-4" /> Select Images
                          </Button>
                          {errors.images && (
                            <p className="text-sm text-destructive mt-4">
                              {errors.images}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4 justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    className="shadow-md hover:cursor-pointer"
                    onClick={() => router.back()}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className={
                      isLoading ? "px-8" : "cursor-pointer px-8 shadow-md"
                    }
                  >
                    {isLoading ? "Creating Listing..." : "Create Listing"}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </main>

      {/* <Footer /> */}
    </div>
  );
};

export default NewListing;
