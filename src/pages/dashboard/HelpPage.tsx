import { motion } from "framer-motion";
import { HelpCircle, Mail, Phone } from "lucide-react";

export default function HelpPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-3xl font-bold text-ink">
          Help & Support
        </h1>

        <p className="mt-2 text-sm text-graytext">
          Need help? Contact us or check the FAQs.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-white p-6">
        <div className="flex items-center gap-3">
          <HelpCircle className="h-8 w-8 text-primary" />
          <h2 className="text-xl font-semibold">
            Frequently Asked Questions
          </h2>
        </div>

        <ul className="mt-6 space-y-3 text-graydark">
          <li>• How do I practice coding?</li>
          <li>• How do I upload my resume?</li>
          <li>• How does AI scoring work?</li>
          <li>• How can I reset my password?</li>
        </ul>
      </div>

      <div className="rounded-2xl border border-border bg-white p-6">
        <h2 className="mb-4 text-xl font-semibold">
          Contact Support
        </h2>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Mail className="h-5 w-5 text-primary" />
            support@placementai.com
          </div>

          <div className="flex items-center gap-3">
            <Phone className="h-5 w-5 text-primary" />
            +91 9876543210
          </div>
        </div>
      </div>
    </motion.div>
  );
}