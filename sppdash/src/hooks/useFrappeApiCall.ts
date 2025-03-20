import { useFrappeGetCall } from "frappe-react-sdk";
import { useParams } from "react-router-dom";

const useFrappeApiCall = (endpoint: string) => {
  const { data, isLoading, error, mutate } = useFrappeGetCall(endpoint, {
    pramas:{}// Disable automatic fetching
  });

  const fetchData = (params: Record<string, any>) => {
    mutate({ params });
  };

  return { data, isLoading, error, fetchData };
};

export default useFrappeApiCall;