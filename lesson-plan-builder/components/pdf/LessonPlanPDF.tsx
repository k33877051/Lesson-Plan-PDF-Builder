"use client";

import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

interface LessonSection {
  id: string;
  type: string;
  title: string;
  content: string;
  duration?: string;
  order: number;
}

interface LessonPlanData {
  id: string;
  title: string;
  subject: string;
  grade: string;
  duration: string;
  teacher?: string;
  school?: string;
  semester?: string;
  sections: LessonSection[];
  createdAt: string;
}

const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#FFFFFF",
    padding: 40,
    fontFamily: "Helvetica",
  },
  header: {
    textAlign: "center",
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: "#2563EB",
    paddingBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#1E40AF",
  },
  subtitle: {
    fontSize: 14,
    color: "#374151",
  },
  metadataContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    padding: 12,
    backgroundColor: "#F3F4F6",
    borderRadius: 4,
  },
  metadataColumn: {
    flex: 1,
  },
  metadataItem: {
    flexDirection: "row",
    marginBottom: 6,
    fontSize: 10,
  },
  metadataLabel: {
    color: "#6B7280",
    width: 70,
  },
  metadataValue: {
    color: "#111827",
    flex: 1,
  },
  section: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    paddingBottom: 4,
  },
  sectionNumber: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#2563EB",
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1F2937",
    flex: 1,
  },
  sectionDuration: {
    fontSize: 10,
    color: "#6B7280",
    backgroundColor: "#E5E7EB",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  sectionContent: {
    fontSize: 11,
    lineHeight: 1.6,
    color: "#374151",
    paddingLeft: 22,
  },
  bulletPoint: {
    flexDirection: "row",
    marginBottom: 3,
  },
  bullet: {
    width: 10,
    fontSize: 11,
  },
  bulletText: {
    flex: 1,
    fontSize: 11,
  },
  subSection: {
    fontWeight: "bold",
    fontSize: 11,
    marginTop: 8,
    marginBottom: 4,
    color: "#1F2937",
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: "center",
    fontSize: 9,
    color: "#9CA3AF",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingTop: 10,
  },
  pageNumber: {
    position: "absolute",
    bottom: 30,
    right: 40,
    fontSize: 9,
    color: "#9CA3AF",
  },
});

function parseContent(content: string): React.ReactElement[] {
  const lines = content.split("\n");
  const elements: React.ReactElement[] = [];
  let key = 0;

  lines.forEach((line) => {
    const trimmed = line.trim();

    if (trimmed === "") {
      return;
    }

    // Sub-section headers (bold text in markdown)
    if (trimmed.startsWith("**") && trimmed.endsWith("**")) {
      elements.push(
        <Text key={key++} style={styles.subSection}>
          {trimmed.replace(/\*\*/g, "")}
        </Text>
      );
    }
    // Bullet points
    else if (trimmed.startsWith("• ") || trimmed.startsWith("- ")) {
      elements.push(
        <View key={key++} style={styles.bulletPoint}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.bulletText}>{trimmed.substring(2)}</Text>
        </View>
      );
    }
    // Numbered lists
    else if (trimmed.match(/^\d+\./)) {
      elements.push(
        <View key={key++} style={styles.bulletPoint}>
          <Text style={styles.bullet}>{trimmed.match(/^\d+/)?.[0]}.</Text>
          <Text style={styles.bulletText}>
            {trimmed.replace(/^\d+\.\s*/, "")}
          </Text>
        </View>
      );
    }
    // Regular text
    else {
      elements.push(
        <Text key={key++} style={styles.sectionContent}>
          {trimmed}
        </Text>
      );
    }
  });

  return elements;
}

export function LessonPlanPDF({ lessonPlan }: { lessonPlan: LessonPlanData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>แผนการจัดการเรียนรู้</Text>
          <Text style={styles.subtitle}>{lessonPlan.title}</Text>
        </View>

        {/* Metadata */}
        <View style={styles.metadataContainer}>
          <View style={styles.metadataColumn}>
            <View style={styles.metadataItem}>
              <Text style={styles.metadataLabel}>วิชา:</Text>
              <Text style={styles.metadataValue}>{lessonPlan.subject}</Text>
            </View>
            <View style={styles.metadataItem}>
              <Text style={styles.metadataLabel}>ระดับชั้น:</Text>
              <Text style={styles.metadataValue}>{lessonPlan.grade}</Text>
            </View>
            <View style={styles.metadataItem}>
              <Text style={styles.metadataLabel}>ระยะเวลา:</Text>
              <Text style={styles.metadataValue}>{lessonPlan.duration}</Text>
            </View>
          </View>
          <View style={styles.metadataColumn}>
            {lessonPlan.teacher && (
              <View style={styles.metadataItem}>
                <Text style={styles.metadataLabel}>ครูผู้สอน:</Text>
                <Text style={styles.metadataValue}>{lessonPlan.teacher}</Text>
              </View>
            )}
            {lessonPlan.school && (
              <View style={styles.metadataItem}>
                <Text style={styles.metadataLabel}>โรงเรียน:</Text>
                <Text style={styles.metadataValue}>{lessonPlan.school}</Text>
              </View>
            )}
            {lessonPlan.semester && (
              <View style={styles.metadataItem}>
                <Text style={styles.metadataLabel}>ภาคเรียน:</Text>
                <Text style={styles.metadataValue}>{lessonPlan.semester}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Sections */}
        {lessonPlan.sections.map((section, index) => (
          <View key={section.id} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionNumber}>{index + 1}.</Text>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              {section.duration && (
                <Text style={styles.sectionDuration}>{section.duration}</Text>
              )}
            </View>
            {parseContent(section.content)}
          </View>
        ))}

        {/* Footer */}
        <View style={styles.footer}>
          <Text>
            สร้างด้วย Lesson Plan PDF Builder | {" "}
            {new Date(lessonPlan.createdAt).toLocaleDateString("th-TH")}
          </Text>
        </View>
        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
          fixed
        />
      </Page>
    </Document>
  );
}

export default LessonPlanPDF;
