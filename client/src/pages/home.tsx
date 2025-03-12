import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Wand2, Search, SortAsc, Edit2, Archive, RefreshCw, HelpCircle, Activity, ArrowRight, Download, Trash2, MoreVertical } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast"; // Import useToast
import { Button } from "@/components/ui/button";

// ... rest of the Home component code ...

export default Home;