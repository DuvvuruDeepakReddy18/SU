-- AlterTable
ALTER TABLE "InterviewBooking" ADD COLUMN     "amountInrPaise" INTEGER,
ADD COLUMN     "paidAt" TIMESTAMP(3),
ADD COLUMN     "razorpayOrderId" TEXT,
ADD COLUMN     "razorpayPaymentId" TEXT;
