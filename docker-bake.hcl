variable "CASHPRACTICE_VERSION" {
  default = "local"
}

variable "IMAGE" {
  default = "ghcr.io/karthikmprakash/cash-practice"
}

group "default" {
  targets = ["app"]
}

target "app" {
  context = "."
  dockerfile = "Dockerfile"
  platforms = ["linux/amd64", "linux/arm64"]
  tags = [
    "${IMAGE}:${CASHPRACTICE_VERSION}",
    "${IMAGE}:latest",
  ]
}
