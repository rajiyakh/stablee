import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { SectionHeading } from "@/components/common/SectionHeading";

const FAQ_ITEMS = [
  {
    question: "What is a Genesis Agent?",
    answer:
      "A collectible RobinPulse AI Agent designed to accumulate future $ORCA allocation according to its configured farming rate.",
  },
  {
    question: "When does farming begin?",
    answer:
      "Farming begins from the activation time defined by the final minting and farming system.",
  },
  {
    question: "Can I claim $ORCA now?",
    answer: "No. $ORCA claims remain locked until TGE and official claim activation.",
  },
  {
    question: "Is minting live?",
    answer: "No, unless the Agent Hub status explicitly shows Public Minting.",
  },
  {
    question: "How is allocation calculated?",
    answer:
      "Allocation is based on active farming duration and the Agent's configured daily farming rate, subject to the final deployed system.",
  },
  {
    question: "Will distribution use a smart contract?",
    answer:
      "The final distribution method may use a claim contract or an official manual distribution process. The selected method will be announced before TGE.",
  },
  {
    question: "Can Agents be transferred or sold?",
    answer:
      "Transfers and secondary-market functionality are not enabled in the initial version unless officially announced.",
  },
  {
    question: "Are the farming rates final?",
    answer:
      "They are pre-launch configuration values and should be treated as subject to final deployment review until minting opens.",
  },
];

export function AgentHubFaq() {
  return (
    <section>
      <SectionHeading eyebrow="Questions" title="Frequently asked questions" />
      <Accordion type="single" collapsible className="mt-6">
        {FAQ_ITEMS.map((item) => (
          <AccordionItem key={item.question} value={item.question}>
            <AccordionTrigger className="text-left text-sm font-medium text-foreground">
              {item.question}
            </AccordionTrigger>
            <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
              {item.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
