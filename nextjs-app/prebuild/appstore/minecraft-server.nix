{
  inputs = {
    xnode-manager.url = "github:Openmesh-Network/xnode-manager";
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
  };

  outputs = inputs: {
    nixosConfigurations.container = inputs.nixpkgs.lib.nixosSystem {
      specialArgs = {
        inherit inputs;
      };
      modules = [
        inputs.xnode-manager.nixosModules.container
        {
          services.xnode-container.xnode-config = {
            host-platform = ./xnode-config/host-platform;
            state-version = ./xnode-config/state-version;
            hostname = ./xnode-config/hostname;
          };
        }
        (
          { pkgs, ... }@args:
          {
            # START USER CONFIG
            services.minecraft-server.serverProperties = {
              motd = "Minecraft server running on Xnode!";
            };
            # END USER CONFIG

            nixpkgs.config.allowUnfree = true;
            services.minecraft-server.enable = true;
            services.minecraft-server.eula = true;
            services.minecraft-server.declarative = true;
            services.minecraft-server.openFirewall = true;
          }
        )
      ];
    };
  };
}
