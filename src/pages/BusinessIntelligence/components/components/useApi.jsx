import { useState } from 'react';
import { akkiourl } from '../../../../utils/const';

export const useFileUpload = () => {
  const [isLoading, setIsLoading] = useState(false);

  const uploadFile = async (file,handleUploadCallback,callbackParams) => {
    try {
      setIsLoading(true);
      const formData = new FormData();
      console.log(file)
      formData.append("file", file);
      formData.append("mail", JSON.parse(localStorage.getItem("user"))?.email);

      const endpoint = `${akkiourl}/upload_only`;
      const response = await fetch(endpoint, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("File upload failed");
      }

      // If a callback is provided, execute it
      if (handleUploadCallback) {
        const {file=null,
            database = false,
            data = [],
            tableName = '',
            sap = false
          } = callbackParams;

        await handleUploadCallback(file, database, data, tableName, sap);
      }

      return { success: true, data: response };
    } catch (error) {
      console.error("Error uploading file:", error);
      return { success: false, error };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    uploadFile,
    isLoading
  };
};
