{
  # BROKEN
  inputs = {
    xnode-manager.url = "github:Openmesh-Network/xnode-manager";
    xnode-ai-chat.url = "github:OpenxAI-Network/xnode-ai-chat";
    nixpkgs.follows = "xnode-ai-chat/nixpkgs";
  };

  outputs = inputs: {
    nixpkgs.config.allowUnfree = true;
    nixosConfigurations.container = inputs.nixpkgs.lib.nixosSystem {
      specialArgs = {
        inherit inputs;
      };
      modules = [
        inputs.xnode-manager.nixosModules.container
        inputs.xnode-ai-chat.nixosModules.default
        {
          # START USER CONFIG
          services.xnode-ai-chat.defaultModel = "deepseek-r1";
          services.xnode-ai-chat.admin.email = "xnode@openmesh.network";
          services.xnode-ai-chat.admin.password = "hunter12";

          networking.hostName = "xnode-ai-chat";
          nixpkgs.hostPlatform = "x86_64-linux";
          system.stateVersion = "25.11";
          # END USER CONFIG

          services.xnode-ai-chat.enable = true;

          networking.firewall.allowedTCPPorts = [
            8080
          ];
        }
      ];
    };
  };
}
