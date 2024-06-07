type ApiResponse<P> = {
  Properties: P;
};

type ListApiResponse<P> = ApiResponse<ApiResponse<P>[]>;

const extractProperties = <T>(response: ApiResponse<T>) => response.Properties;

const extractPropertiesList = <T>(response: ListApiResponse<T>) => {
  return response.Properties.map((response) => response.Properties);
};

export {
  extractProperties,
  extractPropertiesList,
  ApiResponse,
  ListApiResponse,
};
