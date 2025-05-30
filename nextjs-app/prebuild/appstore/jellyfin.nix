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
          # START USER CONFIG
          networking.hostName = "jellyfin";
          nixpkgs.hostPlatform = "x86_64-linux";
          system.stateVersion = "25.11";
          # END USER CONFIG

          services.jellyfin.enable = true;
          services.jellyfin.openFirewall = true;
        }
      ];
    };
  };
}
