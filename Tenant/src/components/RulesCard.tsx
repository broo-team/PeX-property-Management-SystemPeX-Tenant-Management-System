import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

// Simulated API function (replace with your actual API call)
const fetchRulesAndRegulations = async (): Promise<string | null> => {
  const res = await fetch("/api/rules"); // adjust to your endpoint
  if (!res.ok) return null;
  const data = await res.json();
  return data.rulesHtml || null;
};

export default function RulesCard() {
  const [rules, setRules] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRules = async () => {
      try {
        const data = await fetchRulesAndRegulations();
        setRules(data);
      } catch (err) {
        console.error("Failed to load rules:", err);
      } finally {
        setLoading(false);
      }
    };

    loadRules();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rules & Regulations</CardTitle>
        <CardDescription>Important guidelines for tenants</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-[400px] w-full bg-muted" />
        ) : rules ? (
          <ScrollArea className="h-[400px]">
            <div
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ __html: rules }}
            />
          </ScrollArea>
        ) : (
          <p>No rules and regulations found.</p>
        )}
      </CardContent>
    </Card>
  );
}
