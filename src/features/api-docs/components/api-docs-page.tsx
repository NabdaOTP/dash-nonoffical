"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { BookOpen, Play, CheckCircle, AlertCircle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CodeSnippet } from "@/features/instances/components/code-snippet";

const docSections = [
  { id: "getting-started", labelKey: "sections.gettingStarted" },
  { id: "authentication", labelKey: "sections.authentication" },
  { id: "send-message", labelKey: "sections.sendMessage" },
  { id: "get-messages", labelKey: "sections.getMessages" },
  { id: "rate-limits", labelKey: "sections.rateLimits" },
];

export function ApiDocsPage() {
  const [activeSection, setActiveSection] = useState("getting-started");
  const [testPhone, setTestPhone] = useState("+201012345678");
  const [testMessage, setTestMessage] = useState("Your verification code is 123456");
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);
  const t = useTranslations("apiDocs");

  const handleTestApi = () => {
    setTesting(true);
    setTestResult(null);
    setTimeout(() => {
      setTestResult(
        JSON.stringify(
          {
            success: true,
            data: {
              id: "msg_" + Math.random().toString(36).substring(7),
              phone: testPhone,
              status: "queued",
              createdAt: new Date().toISOString(),
            },
          },
          null,
          2
        )
      );
      setTesting(false);
    }, 1500);
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Navigation */}
        <aside className="lg:w-56 shrink-0">
          <div className="lg:sticky lg:top-6 space-y-1">
            <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              {t("title")}
            </h2>
            {docSections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full text-start px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer ${activeSection === section.id
                    ? "bg-accent text-accent-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
              >
                {t(section.labelKey)}
              </button>
            ))}
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 min-w-0 space-y-8">
          {/* Getting Started */}
          {activeSection === "getting-started" && (
            <section className="space-y-6 animate-fade-in">
              <div>
                <h1 className="text-2xl font-bold text-foreground">{t("sections.gettingStarted")}</h1>
                <p className="text-muted-foreground mt-2">{t("gettingStarted.desc")}</p>
              </div>

              <div className="bg-card rounded-xl border border-border p-6 space-y-4">
                <h3 className="font-semibold text-foreground">{t("gettingStarted.quickStart")}</h3>
                <div className="space-y-3">
                  {[
                    t("gettingStarted.step1"),
                    t("gettingStarted.step2"),
                    t("gettingStarted.step3"),
                    t("gettingStarted.step4"),
                  ].map((step, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="h-6 w-6 rounded-full gradient-primary flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-xs font-bold text-primary-foreground">{i + 1}</span>
                      </div>
                      <p className="text-sm text-foreground">{step}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-foreground">{t("gettingStarted.baseUrl")}</h3>
                <code className="block bg-muted/50 rounded-lg px-4 py-3 text-sm font-mono text-foreground">
                  https://api.nabdaotp.com/api/v1
                </code>
              </div>
            </section>
          )}

          {/* Authentication */}
          {activeSection === "authentication" && (
            <section className="space-y-6 animate-fade-in">
              <div>
                <h1 className="text-2xl font-bold text-foreground">{t("sections.authentication")}</h1>
                <p className="text-muted-foreground mt-2">{t("auth.desc")}</p>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">{t("auth.apiKeyAuth")}</p>
                <CodeSnippet
                  snippets={[
                    {
                      language: "Header",
                      code: "Authorization: YOUR_INSTANCE_API_KEY",
                    },
                  ]}
                />
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">{t("auth.jwtAuth")}</p>
                <CodeSnippet
                  snippets={[
                    {
                      language: "Header",
                      code: "Authorization: Bearer YOUR_JWT_TOKEN",
                    },
                  ]}
                />
              </div>

              <div className="bg-accent/50 rounded-xl border border-primary/20 p-4 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">{t("auth.securityTitle")}</p>
                  <p className="text-sm text-muted-foreground mt-1">{t("auth.securityDesc")}</p>
                </div>
              </div>
            </section>
          )}

          {/* Send Message */}
          {activeSection === "send-message" && (
            <section className="space-y-6 animate-fade-in">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Badge className="bg-success/10 text-success border-success/20">POST</Badge>
                  <code className="text-sm font-mono text-foreground">/api/v1/messages/send</code>
                </div>
                <h1 className="text-2xl font-bold text-foreground">{t("sections.sendMessage")}</h1>
                <p className="text-muted-foreground mt-2">{t("sendMessage.desc")}</p>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-foreground">{t("sendMessage.requestBody")}</h3>
                <div className="bg-card rounded-xl border border-border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/30 border-b border-border">
                        <th className="text-start px-4 py-3 font-semibold text-foreground">{t("param")}</th>
                        <th className="text-start px-4 py-3 font-semibold text-foreground">{t("type")}</th>
                        <th className="text-start px-4 py-3 font-semibold text-foreground">{t("description")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-border">
                        <td className="px-4 py-3 font-mono text-primary">
                          phone <Badge variant="outline" className="ms-1 text-[10px] px-1.5 py-0">{t("sendMessage.required")}</Badge>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">string</td>
                        <td className="px-4 py-3 text-foreground">{t("sendMessage.phoneDesc")}</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-mono text-primary">
                          message <Badge variant="outline" className="ms-1 text-[10px] px-1.5 py-0">{t("sendMessage.required")}</Badge>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">string</td>
                        <td className="px-4 py-3 text-foreground">{t("sendMessage.messageDesc")}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <CodeSnippet
                snippets={[
                  {
                    language: "cURL",
                    code: `curl -X POST https://api.nabdaotp.com/api/v1/messages/send \\
  -H "Content-Type: application/json" \\
  -H "Authorization: YOUR_INSTANCE_API_KEY" \\
  -d '{
    "phone": "+201012345678",
    "message": "Your verification code is 123456"
  }'`,
                  },
                  {
                    language: "Node.js",
                    code: `const response = await fetch("https://api.nabdaotp.com/api/v1/messages/send", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": "YOUR_INSTANCE_API_KEY",
  },
  body: JSON.stringify({
    phone: "+201012345678",
    message: "Your verification code is 123456",
  }),
});

const data = await response.json();`,
                  },
                  {
                    language: "Python",
                    code: `import requests

response = requests.post(
    "https://api.nabdaotp.com/api/v1/messages/send",
    headers={
        "Content-Type": "application/json",
        "Authorization": "YOUR_INSTANCE_API_KEY",
    },
    json={
        "phone": "+201012345678",
        "message": "Your verification code is 123456",
    },
)

data = response.json()`,
                  },
                  {
                    language: "Response",
                    code: `{
  "success": true,
  "data": {
    "id": "msg_abc123def456",
    "phone": "+201012345678",
    "status": "queued",
    "createdAt": "2025-01-15T10:30:00.000Z"
  }
}`,
                  },
                ]}
              />
            </section>
          )}

          {/* Get Messages */}
          {activeSection === "get-messages" && (
            <section className="space-y-6 animate-fade-in">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Badge className="bg-primary/10 text-primary border-primary/20">GET</Badge>
                  <code className="text-sm font-mono text-foreground">/api/v1/messages</code>
                </div>
                <h1 className="text-2xl font-bold text-foreground">{t("sections.getMessages")}</h1>
                <p className="text-muted-foreground mt-2">{t("getMessages.desc")}</p>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-foreground">{t("getMessages.queryParams")}</h3>
                <div className="bg-card rounded-xl border border-border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/30 border-b border-border">
                        <th className="text-start px-4 py-3 font-semibold text-foreground">{t("param")}</th>
                        <th className="text-start px-4 py-3 font-semibold text-foreground">{t("type")}</th>
                        <th className="text-start px-4 py-3 font-semibold text-foreground">{t("description")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-border">
                        <td className="px-4 py-3 font-mono text-primary">
                          status <Badge variant="outline" className="ms-1 text-[10px] px-1.5 py-0">{t("getMessages.optional")}</Badge>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">string</td>
                        <td className="px-4 py-3 text-foreground">{t("getMessages.statusDesc")}</td>
                      </tr>
                      <tr className="border-b border-border">
                        <td className="px-4 py-3 font-mono text-primary">
                          page <Badge variant="outline" className="ms-1 text-[10px] px-1.5 py-0">{t("getMessages.optional")}</Badge>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">number</td>
                        <td className="px-4 py-3 text-foreground">{t("getMessages.pageDesc")}</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-mono text-primary">
                          limit <Badge variant="outline" className="ms-1 text-[10px] px-1.5 py-0">{t("getMessages.optional")}</Badge>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">number</td>
                        <td className="px-4 py-3 text-foreground">{t("getMessages.limitDesc")}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <CodeSnippet
                snippets={[
                  {
                    language: "cURL",
                    code: `curl -X GET "https://api.nabdaotp.com/api/v1/messages?status=sent&page=1&limit=50" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN"`,
                  },
                  {
                    language: "Response",
                    code: `{
  "success": true,
  "data": [
    {
      "id": "msg_abc123def456",
      "phone": "+201012345678",
      "message": "Your verification code is 123456",
      "status": "sent",
      "createdAt": "2025-01-15T10:30:00.000Z"
    }
  ]
}`,
                  },
                ]}
              />
            </section>
          )}

          {/* Rate Limits */}
          {activeSection === "rate-limits" && (
            <section className="space-y-6 animate-fade-in">
              <div>
                <h1 className="text-2xl font-bold text-foreground">{t("sections.rateLimits")}</h1>
                <p className="text-muted-foreground mt-2">{t("rateLimits.desc")}</p>
              </div>

              <div className="bg-card rounded-xl border border-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/30 border-b border-border">
                      <th className="text-start px-4 py-3 font-semibold text-foreground">{t("rateLimits.plan")}</th>
                      <th className="text-start px-4 py-3 font-semibold text-foreground">{t("rateLimits.reqPerMin")}</th>
                      <th className="text-start px-4 py-3 font-semibold text-foreground">{t("rateLimits.dailyLimit")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-border">
                      <td className="px-4 py-3 font-medium text-foreground">Free</td>
                      <td className="px-4 py-3 text-muted-foreground">10</td>
                      <td className="px-4 py-3 text-muted-foreground">100</td>
                    </tr>
                    <tr className="border-b border-border">
                      <td className="px-4 py-3 font-medium text-foreground">Pro</td>
                      <td className="px-4 py-3 text-muted-foreground">60</td>
                      <td className="px-4 py-3 text-muted-foreground">5,000</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-medium text-foreground">Enterprise</td>
                      <td className="px-4 py-3 text-muted-foreground">300</td>
                      <td className="px-4 py-3 text-muted-foreground">{t("rateLimits.unlimited")}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>
          )}

          <Separator className="my-8" />

          {/* Try it Live */}
          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <Play className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold text-foreground">{t("tryItLive")}</h2>
            </div>

            <div className="bg-card rounded-xl border border-border p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">{t("phoneNumber")}</label>
                <Input
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  placeholder="+201012345678"
                  className="bg-background font-mono"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">{t("message")}</label>
                <Input
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  placeholder="Your verification code is 123456"
                  className="bg-background font-mono"
                />
              </div>

              <Button
                onClick={handleTestApi}
                disabled={testing}
                className="gradient-primary text-primary-foreground gap-2"
              >
                <Send className="h-4 w-4" />
                {testing ? t("sending") : t("sendTestMessage")}
              </Button>

              {testResult && (
                <div className="space-y-2 animate-fade-in">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-success" />
                    <span className="text-sm font-medium text-success">Response (201 Created)</span>
                  </div>
                  <pre className="bg-muted/30 rounded-lg p-4 text-sm font-mono text-foreground overflow-x-auto">
                    {testResult}
                  </pre>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
