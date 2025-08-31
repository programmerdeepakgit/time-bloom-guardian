import React from 'react';
import { Card } from '@/components/ui/card';
import { TimerButton } from '@/components/ui/timer-button';
import { storageUtils } from '@/utils/storage';
import { generatePDFReport } from '@/utils/pdf';
import { formatTime } from '@/utils/timer';
import { ArrowLeft, FileText, Download, BookOpen, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PDFGeneratorProps {
  studyType: 'self-study' | 'lecture-study';
  onBack: () => void;
}

const PDFGenerator: React.FC<PDFGeneratorProps> = ({ studyType, onBack }) => {
  const { toast } = useToast();
  const records = storageUtils.getRecordsByType(studyType);

  const handleGeneratePDF = () => {
    if (records.length === 0) {
      toast({
        title: "No Records Found",
        description: "You need to have some study sessions before generating a report.",
        variant: "destructive",
      });
      return;
    }

    try {
      generatePDFReport(records, studyType);
      toast({
        title: "PDF Generated Successfully!",
        description: `Your ${studyType === 'self-study' ? 'self study' : 'lecture study'} report has been downloaded.`,
      });
    } catch (error) {
      toast({
        title: "Error Generating PDF",
        description: "Something went wrong while creating your report. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getTotalStudyTime = () => {
    return records.reduce((total, record) => total + record.duration, 0);
  };

  const getSubjectBreakdown = () => {
    const breakdown = records.reduce((acc, record) => {
      acc[record.subject] = (acc[record.subject] || 0) + record.duration;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(breakdown).map(([subject, duration]) => ({
      subject: subject.charAt(0).toUpperCase() + subject.slice(1),
      duration,
      percentage: records.length > 0 ? Math.round((duration / getTotalStudyTime()) * 100) : 0,
    }));
  };

  const subjectBreakdown = getSubjectBreakdown();

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <TimerButton
            variant="secondary"
            size="sm"
            onClick={onBack}
          >
            <ArrowLeft className="w-4 h-4" />
          </TimerButton>
          <div>
            <h1 className="text-2xl font-bold text-primary">
              Generate {studyType === 'self-study' ? 'Self Study' : 'Lecture Study'} Report
            </h1>
            <p className="text-muted-foreground">
              Create a detailed PDF report of your study sessions
            </p>
          </div>
        </div>

        {/* Summary Card */}
        <Card className="gradient-card p-6">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto">
              <FileText className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground mb-2">Report Summary</h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center justify-center gap-2">
                  <BookOpen className="w-4 h-4 text-primary" />
                  <span>{records.length} Sessions</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <Clock className="w-4 h-4 text-success" />
                  <span>{formatTime(getTotalStudyTime())}</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Subject Breakdown */}
        {subjectBreakdown.length > 0 && (
          <Card className="gradient-secondary p-4">
            <h3 className="text-lg font-semibold text-foreground mb-4">Subject Breakdown</h3>
            <div className="space-y-3">
              {subjectBreakdown.map(({ subject, duration, percentage }) => (
                <div key={subject} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-primary rounded-full" />
                    <span className="font-medium text-foreground">{subject}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-mono text-success">{formatTime(duration)}</div>
                    <div className="text-xs text-muted-foreground">{percentage}%</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Generate Button */}
        <div className="space-y-4">
          <TimerButton
            variant="primary"
            size="xl"
            onClick={handleGeneratePDF}
            className="w-full"
            disabled={records.length === 0}
          >
            <Download className="w-5 h-5 mr-2" />
            Generate PDF Report
          </TimerButton>
          
          {records.length === 0 && (
            <Card className="gradient-secondary p-4">
              <div className="text-center text-muted-foreground">
                <p className="text-sm">
                  No study sessions found. Complete some study sessions to generate a report.
                </p>
              </div>
            </Card>
          )}
        </div>

        {/* Footer */}
        <div className="text-center pt-4">
          <p className="text-xs text-muted-foreground">
            Made by programmer_deepak
          </p>
        </div>
      </div>
    </div>
  );
};

export default PDFGenerator;