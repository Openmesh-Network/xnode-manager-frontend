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
        (
          { pkgs, ... }:
          {
            # START USER CONFIG
            services.nextcloud.hostName = "nextcloud.openmesh.network";
            services.nextcloud.config.adminpassFile = builtins.toString (
              pkgs.writeText "nextcloud.password" "xnode"
            );

            networking.hostName = "nextcloud";
            nixpkgs.hostPlatform = "x86_64-linux";
            system.stateVersion = "25.11";
            # END USER CONFIG

            services.nextcloud.enable = true;
            services.nextcloud.https = true;
            services.nextcloud.config.dbtype = "sqlite";
            services.nextcloud.settings.trusted_proxies = [ "192.168.0.0" ];

            networking.firewall.allowedTCPPorts = [ 80 ];
          }
        )
      ];
    };
  };
}
