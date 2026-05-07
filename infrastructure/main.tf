provider "aws" {
  region = "us-east-1"
}

# --- S3 Bucket for Photos ---
resource "aws_s3_bucket" "photos_bucket" {
  bucket = "vritika-ai-photo-vault-bucket"
}

resource "aws_s3_bucket_cors_configuration" "photos_cors" {
  bucket = aws_s3_bucket.photos_bucket.id
  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["PUT", "POST", "GET", "HEAD"]
    allowed_origins = ["*"]
    expose_headers  = []
    max_age_seconds = 3000
  }
}

# --- IAM Role for Lambda Functions ---
resource "aws_iam_role" "lambda_exec_role" {
  name = "lambda_photo_app_exec_role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_policy_attachment" "lambda_basic_execution" {
  name       = "lambda_basic_execution_attachment"
  roles      = [aws_iam_role.lambda_exec_role.name]
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_policy_attachment" "lambda_rekognition_access" {
  name       = "lambda_rekognition_access_attachment"
  roles      = [aws_iam_role.lambda_exec_role.name]
  policy_arn = "arn:aws:iam::aws:policy/AmazonRekognitionFullAccess"
}

# --- Index Photos Lambda ---
resource "aws_lambda_function" "index_photos" {
  function_name    = "index-photos"
  role             = aws_iam_role.lambda_exec_role.arn
  handler          = "index.handler"
  runtime          = "python3.9"
  filename         = "backend/index-photos.zip"
  source_code_hash = filebase64sha256("backend/index-photos.zip")

  environment {
    variables = {
      ES_ENDPOINT = "https://your-opensearch-domain-endpoint"
      ES_INDEX    = "photos"
    }
  }
}

# S3 Event Trigger for Index Lambda
resource "aws_s3_bucket_notification" "bucket_notification" {
  bucket = aws_s3_bucket.photos_bucket.id
  lambda_function {
    lambda_function_arn = aws_lambda_function.index_photos.arn
    events              = ["s3:ObjectCreated:Put"]
  }
}

# --- Search Photos Lambda ---
resource "aws_lambda_function" "search_photos" {
  function_name    = "search-photos"
  role             = aws_iam_role.lambda_exec_role.arn
  handler          = "search.lambda_handler"
  runtime          = "python3.9"
  filename         = "backend/search-photos.zip"
  source_code_hash = filebase64sha256("backend/search-photos.zip")

  environment {
    variables = {
      ES_ENDPOINT = "https://your-opensearch-domain-endpoint"
      ES_INDEX    = "photos"
      BOT_ID      = "YOUR_LEX_BOT_ID"
      BOT_ALIAS_ID = "YOUR_LEX_BOT_ALIAS_ID"
    }
  }
}

# --- API Gateway ---
resource "aws_api_gateway_rest_api" "photo_api" {
  name = "PhotoSearchAPI"
}

resource "aws_api_gateway_resource" "search_resource" {
  rest_api_id = aws_api_gateway_rest_api.photo_api.id
  parent_id   = aws_api_gateway_rest_api.photo_api.root_resource_id
  path_part   = "search"
}

resource "aws_api_gateway_method" "search_method" {
  rest_api_id   = aws_api_gateway_rest_api.photo_api.id
  resource_id   = aws_api_gateway_resource.search_resource.id
  http_method   = "GET"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "search_integration" {
  rest_api_id             = aws_api_gateway_rest_api.photo_api.id
  resource_id             = aws_api_gateway_resource.search_resource.id
  http_method             = aws_api_gateway_method.search_method.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.search_photos.invoke_arn
}

resource "aws_lambda_permission" "apigw_search_lambda" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.search_photos.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.photo_api.execution_arn}/*/*"
}
