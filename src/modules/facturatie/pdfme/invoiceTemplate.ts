import { Template } from '@pdfme/common';

const BLANK_A4_PDF = "data:application/pdf;base64,JVBERi0xLjcKCjEgMCBvYmogICUgZW50cnkgcG9pbnQKPDwKICAvVHlwZSAvQ2F0YWxvZwogIC9QYWdlcyAyIDAgUgo+PgplbmRvYmoKCjIgMCBvYmoKPDwKICAvVHlwZSAvUGFnZXMKICAvTWVkaWFCb3ggWyAwIDAgNTk1LjI4IDg0MS44OSBdCiAgL0NvdW50IDEKICAvS2lkcyBbIDMgMCBSIF0KPj4KZW5kb2JqCgozIDAgb2JqCjw8CiAgL1R5cGUgL1BhZ2UKICAvUGFyZW50IDIgMCBSCiAgL1Jlc291cmNlcyA8PAogICAgL0ZvbnQgPDwKICAgICAgL0YxIDQgMCBSCgkgID4+CiAgPj4KICAvQ29udGVudHMgNSAwIFIKPj4KZW5kb2JqCgo0IDAgb2JqCjw8CiAgL1R5cGUgL0ZvbnQKICAvU3VidHlwZSAvVHlwZTExCiAgL0Jhc2VGb250IC9UaW1lcy1Sb21hbgo+PgplbmRvYmoKCjUgMCBvYmoKPDwgL0xlbmd0aCAwID4+CnN0cmVhbQplbmRzdHJlYW0KZW5kb2JqCgp4cmVmCjAgNgowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAwMTAgMDAwMDAgbiAKMDAwMDAwMDA2MCAwMDAwMCBuIAowMDAwMDAwMTU4IDAwMDAwIG4gCjAwMDAwMDAyNjcgMDAwMDAgbiAKMDAwMDAwMDM1NiAwMDAwMCBuIAp0cmFpbGVyCjw8CiAgL1NpemUgNgogIC9Sb290IDEgMCBSCj4+CnN0YXJ0eHJlZgo0MDYKJSVFT0YK";

export const invoiceTemplate: Template = {
  basePdf: BLANK_A4_PDF,
  schemas: [
    [
      {
        name: "logo",
        type: "image",
        position: { x: 15, y: 15 },
        width: 40,
        height: 15,
      },
      {
        name: "companyDetails",
        type: "text",
        position: { x: 15, y: 35 },
        width: 80,
        height: 30,
        fontSize: 9,
      },
      {
        name: "clientDetails",
        type: "text",
        position: { x: 120, y: 35 },
        width: 75,
        height: 30,
        fontSize: 10,
      },
      {
        name: "invoiceTitle",
        type: "text",
        position: { x: 15, y: 75 },
        width: 180,
        height: 10,
        fontSize: 16,
        fontColor: "#000000",
      },
      {
        name: "invoiceMeta",
        type: "text",
        position: { x: 15, y: 90 },
        width: 180,
        height: 20,
        fontSize: 10,
      },
      {
        name: "invoiceTable",
        type: "table",
        position: { x: 15, y: 115 },
        width: 180,
        height: 80,
        head: ["Omschrijving", "Aantal", "Prijs", "BTW", "Totaal"],
        headWidthPercentages: [40, 15, 15, 15, 15],
        tableStyles: {
          borderColor: "#000000",
          borderWidth: 0.1,
        },
        headStyles: {
          fillColor: "#f4f4f5",
          textColor: "#000000",
        },
        bodyStyles: {
          textColor: "#000000",
        },
        columnStyles: {
          alignment: {
            "0": "left",
            "1": "right",
            "2": "right",
            "3": "right",
            "4": "right"
          }
        }
      },
      {
        name: "summary",
        type: "text",
        position: { x: 120, y: 200 },
        width: 75,
        height: 30,
        fontSize: 10,
        alignment: "right",
      },
      {
        name: "paymentDetails",
        type: "text",
        position: { x: 15, y: 200 },
        width: 100,
        height: 30,
        fontSize: 10,
      },
      {
        name: "footer",
        type: "text",
        position: { x: 15, y: 270 },
        width: 180,
        height: 15,
        fontSize: 8,
        alignment: "center",
        fontColor: "#666666",
      }
    ]
  ]
};
